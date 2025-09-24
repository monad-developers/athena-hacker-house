// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Minimal staking + voting registry for jury selection.
 * - Jurors stake native token to join pool
 * - Random selection handled off-chain or via VRF-like adapter (out of scope for MVP)
 * - Voting recorded per claimId; simple majority with quorum
 * - Slashing entry points provided (governance callable)
 */
contract JuryStaking {
    struct Juror { uint256 stake; bool active; }
    mapping(address => Juror) public jurors;
    uint256 public totalStaked;
    address public governance;

    event Staked(address indexed juror, uint256 amount);
    event Unstaked(address indexed juror, uint256 amount);
    event Vote(address indexed juror, bytes32 indexed claimId, bool approve);
    event Slashed(address indexed juror, uint256 amount);

    // claimId => votes
    struct Tally { uint256 yes; uint256 no; uint256 quorum; bool decided; bool approved; }
    mapping(bytes32 => Tally) public tallies;

    modifier onlyGovernance() { require(msg.sender == governance, "only gov"); _; }

    constructor(address _gov) { governance = _gov; }

    function stake() external payable {
        require(msg.value > 0, "no value");
        jurors[msg.sender].stake += msg.value;
        jurors[msg.sender].active = true;
        totalStaked += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    function requestUnstake(uint256 amount) external {
        Juror storage j = jurors[msg.sender];
        require(j.stake >= amount && amount > 0, "bad amount");
        j.stake -= amount;
        totalStaked -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "transfer failed");
        if (j.stake == 0) j.active = false;
        emit Unstaked(msg.sender, amount);
    }

    function setQuorum(bytes32 claimId, uint256 quorum) external onlyGovernance {
        require(quorum > 0, "quorum=0");
        tallies[claimId].quorum = quorum;
    }

    function vote(bytes32 claimId, bool approve) external {
        require(jurors[msg.sender].active, "not juror");
        require(!tallies[claimId].decided, "decided");
        // simplistic: each juror 1 vote; prevent double-vote via bitmap
        bytes32 key = keccak256(abi.encodePacked(claimId, msg.sender));
        require(_voted[key] == false, "voted");
        _voted[key] = true;
        if (approve) tallies[claimId].yes += 1; else tallies[claimId].no += 1;
        emit Vote(msg.sender, claimId, approve);
    }

    function finalize(bytes32 claimId) external {
        Tally storage t = tallies[claimId];
        require(!t.decided, "decided");
        require(t.yes + t.no >= t.quorum && t.quorum > 0, "no quorum");
        t.decided = true;
        t.approved = t.yes > t.no;
    }

    function slash(address juror, uint256 amount) external onlyGovernance {
        Juror storage j = jurors[juror];
        require(j.stake >= amount && amount > 0, "bad amount");
        j.stake -= amount;
        totalStaked -= amount;
        emit Slashed(juror, amount);
    }

    mapping(bytes32 => bool) private _voted;
}


