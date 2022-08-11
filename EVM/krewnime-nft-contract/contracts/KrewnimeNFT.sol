// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./openzeppelin/token/ERC721/ERC721.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import "./openzeppelin/interfaces/IERC2981.sol";
import "./openzeppelin/security/Pausable.sol";
import "./openzeppelin/utils/Counters.sol";
import "./openzeppelin/utils/Strings.sol";
import "./openzeppelin/access/AccessControl.sol";
import "./IMintable.sol";
import "./ERC2981.sol";

/**
 * @title The Krewnime NFT Collection 
 * @author John R. Kosinski 
 * 
 * This project allows the single contract owner to mint all tokens at once or individually, 
 * with the option to (a) add more tokens to the collection in the future and mint them, 
 * and (b) to create a new version of the store contract if desired, in order to change the 
 * rules for the selling and minting of NFTs. 
 * 
 * The design creates a basic NFT contract that allows for: 
 * - pausing and unpausing 
 * - changing the collection size (adding to the collection) 
 * - receiving royalties (ERC-2981) 
 * - enumerable 
 * - mintable 
 * - burnable 
 * - URI storage 
 * - role-based security
 * 
 * The business rules for selling and minting are stored separately in the TokenMintStore 
 * contract. If the business rules change, that contract can be decommissioned and replaced
 * by another contract, which is assigned the Mintable role for the NFT, replacing the 
 * old store with the new one. 
 * 
 * The base use case here is for the collection owner to mint the entire collection 
 * initially, to be sold on a marketplace. 
 * 
 * NOTE that this set of contracts is meant to be full-featured and not low-gas. A 
 * low-gas version may be implemented in the future. 
 * 
 * Remedial action upon compromise is to pause the contract. 
 */
contract KrewnimeNFT is 
        IMintable, 
        ERC721, 
        ERC721Enumerable, 
        ERC721URIStorage, 
        IERC2981,
        Pausable, 
        AccessControl,
        ERC2981 {
    using Strings for uint256; 
    
    //max number of items that can be minted; 1 by default
    uint256 public maxSupply = 1; 
    
    //max number of items in collection; 1 by default 
    uint256 public collectionSize = 1; 
    
    // <user address> => <number of mints minted to that address in the past> 
    mapping(address => uint256) private addressMintHistory; 
    
    //base URI must be changed to a valid URI. <n>.png (sequential) will be appended 
    //to the base URI to create URIs for newly minted tokens 
    string public baseUri = "ipfs://{hash}/";
    
    //the token ID is a simple increment. The first one minted will be 1 
    uint256 private _tokenIdCounter = 0;
    
    //security roles 
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER");

    /**
     * @dev Constructor. 
     * 
     * @param initialOwner Initial owner address (if 0x0, owner becomes msg.sender)
     * @param tokenName NFT token name 
     * @param tokenSymbol NFT token symbol 
     * @param _maxSupply Number of items allowed to be minted
     * @param _collectionSize Number of items in the collection 
     * @param _baseUri Base URI used in token URI generation (incremented)
     */
    constructor(
        address initialOwner,
        string memory tokenName, 
        string memory tokenSymbol, 
        uint256 _maxSupply, 
        uint256 _collectionSize, 
        string memory _baseUri
        ) ERC721(tokenName, tokenSymbol) {
            
        require(_maxSupply >= _collectionSize, "KRW: Collection size cannot exceed max supply.");
        require(bytes(tokenName).length > 0, "KRW: Token name should have a value"); 
        require(bytes(tokenSymbol).length > 0, "KRW: Token symbol should have a value"); 
        require(bytes(_baseUri).length > 0, "KRW: Base URI should have a value"); 
        
        //if an address is passed, it is the owner 
        if (initialOwner == address(0)) {
            initialOwner = msg.sender;
        }
        
        //creator is admin and minter 
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        
        //set state 
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
        baseUri = _baseUri; 
    }

    /**
     * @dev Pauses the contract execution. Functions like transfer and mint will 
     * revert when contract is paused. 
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract execution. 
     * Will revert if contract is not paused. 
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Owner can change the maxSupply - the max number of items that can be minted, 
     * and the collections size - the max that can be minted per owner. 
     * 
     * @param _maxSupply The new value to set for maxSupply. 
     * @param _collectionSize The new value to set for collectionSize. 
     */
    function setSupplyParameters(uint256 _maxSupply, uint256 _collectionSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_maxSupply >= _collectionSize, "KRW: Collection size cannot exceed max supply.");
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
    }
    
    /**
     * @dev Allows the owner to change the base token URI used to generate new token URIs. 
     * 
     * @param _baseUri The new value of baseUri. 
     */
    function setBaseUri(string memory _baseUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseUri = _baseUri; 
    }

    /**
     * @dev Allows authorized caller (minter role only) to mint one. 
     * 
     * @param to The address of the token recipient once minted. 
     * @return The token ID of the minted token. 
     */
    function mintNext(address to) external override onlyRole(MINTER_ROLE) returns (uint256) {
        return _mintNext(to);
    }
    
    /**
     * @dev Mints the entire collection to the admin or owner (caller). 
     * Will revert if totalSupply() > 0. 
     */
    function initialMint() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(totalSupply() == 0, "KRW: totalSupply must be zero in order to call initialMint"); 
        for(uint n=0; n<collectionSize; n++) {
            _mintNext(msg.sender);
        }
    }
    
    /**
     * @dev Mints the specified number of items in the collection to the given address. 
     * 
     * If the address contains part of the collection already, starts from the last one 
     * minted to that address. 
     * The last index of the collection won't be exceeded. 
     * @return The number of tokens minted. 
     */
    function multiMint(address to, uint256 count) external override onlyRole(MINTER_ROLE) returns (uint256) {
        require(count <= collectionSize, "KRW: Count cannot exceed collection size"); 
        
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
     * @dev Owner of a token may burn or destroy it. 
     * 
     * @param _tokenId The id of the token to burn. 
     */
    function burn(uint256 _tokenId) external virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ERC721Burnable: caller is not owner nor approved");
        
        //burn it 
        _burn(_tokenId);
    }

    /**
     * @dev Returns the URI of the specified token. 
     * 
     * @param _tokenId The id of a token whose URI to return.
     * @return string Token URI. 
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }

    /**
     * @dev ERC-165 implementation. 
     * 
     * @param _interfaceId An ERC-165 interface id to query. 
     * @return bool Whether or not the interface is supported by this contract. 
     */
    function supportsInterface(bytes4 _interfaceId)
        public
        view
        override(IERC165, ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return _interfaceId == type(IERC2981).interfaceId || super.supportsInterface(_interfaceId); 
    }
    
    /**
     * See { ERC2981-setRoyaltyInfo }
     */
    function setRoyaltyInfo(address receiver, uint96 feeNumerator, uint96 feeDenominator) public override (ERC2981) onlyRole(DEFAULT_ADMIN_ROLE) {
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
    function clearRoyaltyInfo() public override (ERC2981) onlyRole(DEFAULT_ADMIN_ROLE) {
        super.clearRoyaltyInfo();
    }
    
    /**
     * See { ERC2981-_royaltyInfo }
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) public view virtual override returns (address receiver, uint256 amount) {
        return _royaltyInfo(_tokenId, _salePrice);
    }
    
    
    /// NON-PUBLIC METHODS 

    function _beforeTokenTransfer(address _from, address _to, uint256 _tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)  {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }
    
    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) whenNotPaused {
        super._burn(_tokenId);
    }
    
    function _approve(address to, uint256 tokenId) internal override whenNotPaused {
        super._approve(to, tokenId);
    }
    
    function _concatUri(uint256 _tokenId) private view returns (string memory) {
        return string(abi.encodePacked(baseUri, _tokenId.toString(), ".json"));
    }
    
    function _mintNext(address to) private returns (uint256) {
        require(this.totalSupply() < maxSupply, "KRW: Max supply exceeded"); 
        require(addressMintHistory[to] < collectionSize, "NFT: Max allowed per user exceeded"); 
            
        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
        addressMintHistory[to] += 1;
        _setTokenURI(tokenId, _concatUri(addressMintHistory[to]));
        return tokenId;
    }
}