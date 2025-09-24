// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

/**
 * Soulbound NFT for government officials. Non-transferable, immutable metadata.
 */
contract GovernmentRegistry is IERC721 {
    struct Official {
        string name;
        string position;
        string region;
        string contactId;
        address wallet;
        bool exists;
    }

    string public name = "MonadRelief Government Official";
    string public symbol = "MR-GOV";
    address public governance;
    uint256 public nextId = 1;

    mapping(uint256 => Official) public officials;
    mapping(address => uint256) public walletToTokenId;

    modifier onlyGovernance() {
        require(msg.sender == governance, "only gov");
        _;
    }

    constructor(address _governance) {
        require(_governance != address(0), "bad gov");
        governance = _governance;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC721).interfaceId;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return walletToTokenId[owner] == 0 ? 0 : 1;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        require(officials[tokenId].exists, "no token");
        return officials[tokenId].wallet;
    }

    function getApproved(uint256) external pure returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }

    // Mint soulbound NFT; immutable once created
    function mintOfficial(
        address wallet,
        string memory _name,
        string memory _position,
        string memory _region,
        string memory _contactId
    ) external onlyGovernance returns (uint256 tokenId) {
        require(wallet != address(0), "bad wallet");
        require(walletToTokenId[wallet] == 0, "exists");
        tokenId = nextId++;
        officials[tokenId] = Official({
            name: _name,
            position: _position,
            region: _region,
            contactId: _contactId,
            wallet: wallet,
            exists: true
        });
        walletToTokenId[wallet] = tokenId;
        emit Transfer(address(0), wallet, tokenId);
    }

    // Soulbound: disable transfers/approvals
    function approve(address, uint256) external pure { revert("soulbound"); }
    function setApprovalForAll(address, bool) external pure { revert("soulbound"); }
    function transferFrom(address, address, uint256) external pure { revert("soulbound"); }
    function safeTransferFrom(address, address, uint256) external pure { revert("soulbound"); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert("soulbound"); }
}


