// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * MonadRelief: Real-time micro-donations for disaster relief on Monad L1
 * - Micro-donations starting at $0.01-equivalent (handled via stablecoin decimals)
 * - Instant distribution to verified beneficiaries
 * - Full on-chain transparency through events and mappings
 */
contract MonadRelief {
    struct Beneficiary {
        address wallet;
        bool verified;
        uint256 totalReceived;
    }

    address public governance; // DAO multisig or governance contract
    uint256 public totalDonations;
    uint256 public totalDisbursed;
    uint256 public totalDonationCount;
    uint256 public uniqueDonorCount;

    // beneficiaryId -> Beneficiary
    mapping(bytes32 => Beneficiary) public beneficiaries;
    // donor -> hasDonated
    mapping(address => bool) public donorHasDonated;

    event BeneficiaryRegistered(bytes32 indexed id, address indexed wallet);
    event BeneficiaryVerified(bytes32 indexed id, address indexed wallet);
    event Donation(address indexed donor, uint256 amount, bytes32 indexed beneficiaryId);
    event Disbursement(bytes32 indexed beneficiaryId, address indexed wallet, uint256 amount);

    modifier onlyGovernance() {
        require(msg.sender == governance, "only governance");
        _;
    }

    constructor(address _governance) {
        require(_governance != address(0), "invalid governance");
        governance = _governance;
    }

    function registerBeneficiary(bytes32 id, address wallet) external onlyGovernance {
        require(wallet != address(0), "invalid wallet");
        Beneficiary storage b = beneficiaries[id];
        require(b.wallet == address(0), "exists");
        b.wallet = wallet;
        emit BeneficiaryRegistered(id, wallet);
    }

    function setVerified(bytes32 id, bool verified) external onlyGovernance {
        Beneficiary storage b = beneficiaries[id];
        require(b.wallet != address(0), "not found");
        b.verified = verified;
        emit BeneficiaryVerified(id, b.wallet);
    }

    // Accepts native token donations. For stablecoins, deploy an ERC20 variant that calls donateERC20.
    function donate(bytes32 beneficiaryId) external payable {
        require(msg.value > 0, "no value");
        Beneficiary storage b = beneficiaries[beneficiaryId];
        require(b.wallet != address(0), "beneficiary missing");
        require(b.verified, "not verified");

        totalDonations += msg.value;
        totalDonationCount += 1;
        if (!donorHasDonated[msg.sender]) {
            donorHasDonated[msg.sender] = true;
            uniqueDonorCount += 1;
        }

        // Instant forward to beneficiary wallet
        (bool sent, ) = b.wallet.call{value: msg.value}("");
        require(sent, "transfer failed");
        b.totalReceived += msg.value;
        totalDisbursed += msg.value;

        emit Donation(msg.sender, msg.value, beneficiaryId);
        emit Disbursement(beneficiaryId, b.wallet, msg.value);
    }
}


