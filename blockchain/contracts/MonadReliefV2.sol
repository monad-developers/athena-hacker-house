// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBeneficiaryRegistry {
    function isApproved(bytes32 beneficiaryId) external view returns (bool);
    function walletOf(bytes32 beneficiaryId) external view returns (address);
}

/**
 * Donation contract that routes funds only to approved beneficiaries
 * (approved by both government SBT holder and jury consensus).
 */
contract MonadReliefV2 {
    IBeneficiaryRegistry public registry;
    address public governance;

    uint256 public totalDonations;
    uint256 public totalDisbursed;
    uint256 public totalDonationCount;
    uint256 public uniqueDonorCount;
    mapping(address => bool) public donorHasDonated;

    event Donation(address indexed donor, uint256 amount, bytes32 indexed beneficiaryId);
    event Disbursement(bytes32 indexed beneficiaryId, address indexed wallet, uint256 amount);

    modifier onlyGovernance() { require(msg.sender == governance, "only gov"); _; }

    constructor(address _gov, address _registry) {
        governance = _gov;
        registry = IBeneficiaryRegistry(_registry);
    }

    function donate(bytes32 beneficiaryId) external payable {
        require(msg.value > 0, "no value");
        require(registry.isApproved(beneficiaryId), "not approved");
        address wallet = registry.walletOf(beneficiaryId);
        require(wallet != address(0), "no wallet");

        totalDonations += msg.value;
        totalDonationCount += 1;
        if (!donorHasDonated[msg.sender]) { donorHasDonated[msg.sender] = true; uniqueDonorCount += 1; }

        (bool sent, ) = wallet.call{value: msg.value}("");
        require(sent, "transfer failed");
        totalDisbursed += msg.value;

        emit Donation(msg.sender, msg.value, beneficiaryId);
        emit Disbursement(beneficiaryId, wallet, msg.value);
    }
}


