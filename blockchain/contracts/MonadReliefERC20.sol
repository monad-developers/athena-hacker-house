// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IBeneficiaryRegistryErc20 {
    function isApproved(bytes32 beneficiaryId) external view returns (bool);
    function walletOf(bytes32 beneficiaryId) external view returns (address);
}

contract MonadReliefERC20 {
    IBeneficiaryRegistryErc20 public registry;
    address public governance;
    IERC20 public stablecoin;

    uint256 public totalDonations;
    uint256 public totalDisbursed;
    uint256 public totalDonationCount;
    uint256 public uniqueDonorCount;
    mapping(address => bool) public donorHasDonated;

    event Donation(address indexed donor, uint256 amount, bytes32 indexed beneficiaryId);
    event Disbursement(bytes32 indexed beneficiaryId, address indexed wallet, uint256 amount);

    constructor(address _gov, address _registry, address _token) {
        governance = _gov;
        registry = IBeneficiaryRegistryErc20(_registry);
        stablecoin = IERC20(_token);
    }

    function donate(bytes32 beneficiaryId, uint256 amount) external {
        require(amount > 0, "no value");
        require(registry.isApproved(beneficiaryId), "not approved");
        address wallet = registry.walletOf(beneficiaryId);
        require(wallet != address(0), "no wallet");

        totalDonations += amount;
        totalDonationCount += 1;
        if (!donorHasDonated[msg.sender]) { donorHasDonated[msg.sender] = true; uniqueDonorCount += 1; }

        bool ok = stablecoin.transferFrom(msg.sender, wallet, amount);
        require(ok, "transfer failed");
        totalDisbursed += amount;

        emit Donation(msg.sender, amount, beneficiaryId);
        emit Disbursement(beneficiaryId, wallet, amount);
    }
}


