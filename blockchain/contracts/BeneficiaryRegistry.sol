// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGovernmentRegistry {
    function walletToTokenId(address wallet) external view returns (uint256);
}

interface IJuryStaking {
    function tallies(bytes32 claimId) external view returns (uint256 yes, uint256 no, uint256 quorum, bool decided, bool approved);
}

/**
 * BeneficiaryRegistry links claim documents and approval states.
 * - Docs are stored off-chain (IPFS/Arweave), with on-chain hashes recorded.
 * - A claim requires both: Jury approved AND a government official approval.
 */
contract BeneficiaryRegistry {
    struct Claim {
        address wallet;
        bytes32 disasterId;
        bytes32 docHash; // hash of manifest of uploaded docs
        bool govApproved;
        bool juryApproved;
        bool active;
    }

    address public governance;
    IGovernmentRegistry public govRegistry;
    IJuryStaking public jury;

    // beneficiaryId => Claim
    mapping(bytes32 => Claim) public claims;
    // Track uniqueness: (disasterId + userIdHash) => used
    mapping(bytes32 => bool) public uniqueness;

    event ClaimSubmitted(bytes32 indexed beneficiaryId, address indexed wallet, bytes32 disasterId, bytes32 docHash);
    event GovApproved(bytes32 indexed beneficiaryId, address indexed official);
    event JuryFinalized(bytes32 indexed beneficiaryId, bool approved);

    modifier onlyGovernance() { require(msg.sender == governance, "only gov"); _; }

    constructor(address _gov, address _govReg, address _jury) {
        governance = _gov;
        govRegistry = IGovernmentRegistry(_govReg);
        jury = IJuryStaking(_jury);
    }

    function submitClaim(bytes32 beneficiaryId, address wallet, bytes32 disasterId, bytes32 userUniqueHash, bytes32 docHash) external {
        require(wallet != address(0), "bad wallet");
        require(claims[beneficiaryId].wallet == address(0), "exists");
        bytes32 key = keccak256(abi.encodePacked(disasterId, userUniqueHash));
        require(!uniqueness[key], "duplicate user");
        uniqueness[key] = true;
        claims[beneficiaryId] = Claim({
            wallet: wallet,
            disasterId: disasterId,
            docHash: docHash,
            govApproved: false,
            juryApproved: false,
            active: true
        });
        emit ClaimSubmitted(beneficiaryId, wallet, disasterId, docHash);
    }

    // Called by a government official (must hold SBT)
    function governmentApprove(bytes32 beneficiaryId) external {
        require(govRegistry.walletToTokenId(msg.sender) != 0, "not official");
        Claim storage c = claims[beneficiaryId];
        require(c.active, "no claim");
        c.govApproved = true;
        emit GovApproved(beneficiaryId, msg.sender);
    }

    // Pull jury result from JuryStaking
    function refreshJury(bytes32 beneficiaryId, bytes32 claimId) external {
        Claim storage c = claims[beneficiaryId];
        require(c.active, "no claim");
        (, , , bool decided, bool approved) = jury.tallies(claimId);
        if (decided && approved) {
            c.juryApproved = true;
        }
        emit JuryFinalized(beneficiaryId, c.juryApproved);
    }

    function isApproved(bytes32 beneficiaryId) public view returns (bool) {
        Claim storage c = claims[beneficiaryId];
        return c.active && c.govApproved && c.juryApproved;
    }

    function walletOf(bytes32 beneficiaryId) external view returns (address) {
        return claims[beneficiaryId].wallet;
    }
}


