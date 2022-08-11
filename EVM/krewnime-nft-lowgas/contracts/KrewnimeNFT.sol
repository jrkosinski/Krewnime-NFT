// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ERC721A/ERC721A.sol"; 
import "./ERC2981.sol";

//TODO: comment it up 
//TODO: order the functions 
//TODO: the collection -transfer problem
//TODO: account for initialOwner in ctor, and add test 
//TODO: replace to.be.reverted with to.be.revertedWith
//TODO: pack the values 

/**
 * @title The Krewnime NFT Collection (low gas usage)
 * @author John R. Kosinski 
 * 
 * This project allows the single contract owner to mint all tokens at once or individually, 
 * with the option to (a) add more tokens to the collection in the future and mint them, 
 * and (b) to create a new version of the store contract if desired, in order to change the 
 * rules for the selling and minting of NFTs. 
 * 
 * The design creates a basic NFT contract that allows for: 
 * - changing the collection size (adding to the collection) 
 * - receiving royalties (ERC-2981) 
 * - enumerable 
 * - mintable 
 * - burnable 
 * - URI storage 
 * - ADMIN and MINTER security roles 
 * 
 * The business rules for selling and minting are stored separately in the TokenMintStore 
 * contract. If the business rules change, that contract can be decommissioned and replaced
 * by another contract, which is assigned the Mintable role for the NFT, replacing the 
 * old store with the new one. 
 * 
 * The base use case here is for the collection owner to mint the entire collection 
 * initially, to be sold on a marketplace. 
 * 
 * Remedial action upon compromise is to pause the contract. 
 */
contract KrewnimeNFT is ERC721A, ERC2981 {
    address public tokenAdminAddress;   //TODO: pack all values 
    address public tokenMinterAddress;  
    
    uint256 public maxSupply = 10; 
    uint256 public collectionSize = 10; 
    
    error NotAuthorized();
    error CollectionSizeExceeded();
    error MaxSupplyExceeded(); 
    error InitialMintAlreadyDone();
    
    mapping(uint256 => uint256) private tokenIdsToUris; 
    
    modifier adminOnly {
        if (!hasRole(keccak256("ADMIN"), _msgSenderERC721A())) {
            revert NotAuthorized();
        }
        _; 
    }
    
    modifier minterOnly {
        if (!hasRole(keccak256("MINTER"), _msgSenderERC721A())) {
            revert NotAuthorized();
        }
        _; 
    }
    
    /**
     * @dev Constructor. 
     * 
     * @param initialOwner Initial owner address (if 0x0, owner becomes msg.sender)
     * @param tokenName NFT token name 
     * @param tokenSymbol NFT token symbol 
     * @param _maxSupply Number of items allowed to be minted
     * @param _collectionSize Number of items in the collection 
     */
    constructor(
        address initialOwner,
        string memory tokenName, 
        string memory tokenSymbol,
        uint256 _maxSupply, 
        uint256 _collectionSize
    ) ERC721A(tokenName, tokenSymbol) {
        if (_collectionSize > _maxSupply) 
            revert MaxSupplyExceeded(); 
        
        tokenAdminAddress = (initialOwner == address(0) ? msg.sender : initialOwner); 
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
    }
    
    /**
     * @dev Allows authorized caller (minter role only) to mint one. 
     * 
     * @param to The address of the token recipient once minted. 
     * @return The token ID of the minted token. 
     */
    function mintNext(address to) external minterOnly returns (uint256) {
        return _mintNext(to); 
    }
    
    /**
     * @dev Mints the specified number of items in the collection to the given address. 
     * 
     * If the address contains part of the collection already, starts from the last one 
     * minted to that address. 
     * The last index of the collection won't be exceeded. 
     * @return The number of tokens minted. 
     */
    function multiMint(address to, uint256 count) external minterOnly returns(uint256) {
        if (count > collectionSize) 
            revert CollectionSizeExceeded(); 
        
        //get the start index & limit
        uint256 startIndex = this.balanceOf(to); 
        uint256 limit = startIndex + count; 
        if (limit > collectionSize) {
            limit = collectionSize;
        }
        
        //mint tokens and count number minted
        uint256 numberMinted = 0;
        for(uint n=startIndex; n<limit; n++) {
            _mintNext(to);
            numberMinted++;
        }
        
        return numberMinted;
    }
    
    /**
     * @dev Mints the entire collection to the admin or owner (caller). 
     * Will revert if totalSupply() > 0. 
     */
    function initialMint() external adminOnly {
        if (totalSupply() > 0) 
            revert InitialMintAlreadyDone();
            
        for(uint n=0; n<collectionSize; n++) {
            _mintNext(_msgSenderERC721A());
        }
    }
    
    /**
     * @dev Owner of a token may burn or destroy it. 
     * 
     * @param tokenId The id of the token to burn. 
     */
    function burn(uint256 tokenId) external {
        return _burn(tokenId, true);
    }
    
    function hasRole(bytes32 role, address account) public view returns (bool) {
        if (role == keccak256("ADMIN")) {
            return (account == tokenAdminAddress);
        }
        else if (role == keccak256("MINTER")) {
            return (account == tokenMinterAddress) || (account == tokenAdminAddress);
        }
        
        return false;
    }
    
    function transferRole(bytes32 role, address account) external {
        //TODO: implement
    }
    
    function setMinter(address account) external adminOnly {
        tokenMinterAddress = account;
    }
    
    /**
     * @dev Returns the URI of the specified token. 
     * 
     * @param tokenId The id of a token whose URI to return.
     * @return string Token URI. 
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory uri = string(abi.encodePacked(_baseURI(), _toString(tokenIdsToUris[tokenId])));        
        return string(abi.encodePacked(uri, _uriSuffix())); 
    }
    
    /**
     * @dev Admin can change the maxSupply - the max number of items that can be minted, 
     * and the collections size - the max that can be minted per owner. 
     * 
     * @param _maxSupply The new value to set for maxSupply. 
     * @param _collectionSize The new value to set for collectionSize. 
     */
    function setSupplyParameters(uint256 _maxSupply, uint256 _collectionSize) external adminOnly {
       if (_collectionSize > _maxSupply)
            revert MaxSupplyExceeded(); 
            
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
    }
    
    /**
     * See { ERC2981-setRoyaltyInfo }
     */
    function setRoyaltyInfo(address receiver, uint96 feeNumerator, uint96 feeDenominator) public override (ERC2981) adminOnly {
        super.setRoyaltyInfo(receiver, feeNumerator, feeDenominator); 
    }
    
    /**
     * See { ERC2981-getRoyaltyInfo }
     */
    function getRoyaltyInfo() public override (ERC2981) view returns (address receiver, uint96 feeNumerator, uint96 feeDenominator) {
        return super.getRoyaltyInfo();
    }
    
    /**
     * See { ERC2981-clearRoyaltyInfo }
     */
    function clearRoyaltyInfo() public override (ERC2981) adminOnly {
        super.clearRoyaltyInfo();
    }
    
    /**
     * See { ERC2981-_royaltyInfo }
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) public view virtual returns (address receiver, uint256 amount) {
        return _royaltyInfo(_tokenId, _salePrice);
    }
    
    /// NON-PUBLIC METHODS 
    
    function _mintNext(address to) private returns (uint256) {
        if (this.totalSupply() >= maxSupply)
            revert MaxSupplyExceeded();
        if (this.balanceOf(to) >= collectionSize)
            revert CollectionSizeExceeded();
            
        uint256 tokenId = _nextTokenId();
        _safeMint(to, 1);
        tokenIdsToUris[tokenId] = this.balanceOf(to);
        return tokenId;
    }
    
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }
    
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://base_uri/"; //TODO: update this to real value 
    }
    
    function _uriSuffix() internal view virtual returns (string memory) {
        return ".json"; 
    }
}