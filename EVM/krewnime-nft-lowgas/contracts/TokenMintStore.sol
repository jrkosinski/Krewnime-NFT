// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IMintable.sol";

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
 * This contract can work with any IMintable. 
 * 
 * To enable it, create it with the address  of the NFT contract to be minted in 
 * the constructor. Then, for the NFT contract (which should implement role-based  
 * security) enable the MINTER role for this TokenMintStore contract. Now this contract 
 * is set up to sell mints of the specified NFT. 
 * 
 * This contract is a simple Ownable. The remedial action upon compromise is to either 
 * pause this contract, remove its MINTER role from the associated NFT contract, or both.
 */
contract TokenMintStore {
    IMintable public nftContract; //TODO: pack all values 
    uint256 public mintPrice = 0; 
    address owner = address(0); 
    
    error NotAuthorized();
    error TokenAddressNotSet();
    error InsufficientFeePaid();
    
    /**
     * @dev Emitted when an attempt is made to withdraw ether from contract.
     */
    event Withdraw (
        address sender,
        uint256 amount,
        bool success
    );
    
    /**
     * @dev Emitted when a request to mint completes without reverting. 
     */
    event Mint (
        address sender, 
        address to, 
        uint256 amount,
        uint256 number
    );
    
    /**
     * @dev Constructor. 
     * 
     * @param _nftContract The address of the NFT contract whose items are being sold. 
     * @param _mintPrice The price charged per unit to mint. 
     */
    constructor(IMintable _nftContract, uint256 _mintPrice) {
        nftContract = _nftContract;
        mintPrice = _mintPrice;
        owner = msg.sender;
    }
    
    /**
     * @dev Owner can set the price to mint an NFT. 
     * 
     * @param _mintPrice The price to set. 
     */
    function setMintPrice(uint256 _mintPrice) external  {
        if(msg.sender != owner)
            revert NotAuthorized();
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Anyone can purchase the right to mint, and mint an NFT from contract. 
     * 
     * @param to The NFT token recipient. 
     * @return tokenId The ID of the minted token. 
     */
    function mintNext(address to) external payable returns(uint256) {
        if (address(nftContract) == address(0)) 
            revert TokenAddressNotSet(); 
            
        if (msg.value < getMintPrice(msg.sender))
            revert InsufficientFeePaid(); 
        
        uint256 id = nftContract.mintNext(to); 
        
        emit Mint(msg.sender, to, msg.value, 1); 
        
        return id; 
    }
    
    /**
     * @dev Sell multiple mints in the collection to a single user. Will be reverted if the 
     * number to be minted exceeds the number allowed.
     * 
     * @param to The NFT token recipient. 
     * @return The number minted and sold. 
     */
    function multiMint(address to, uint256 count) external payable returns (uint256) {
        if (address(nftContract) == address(0)) 
            revert TokenAddressNotSet(); 
        
        uint256 numberMinted = nftContract.multiMint(to, count); 
        if (msg.value < (numberMinted * getMintPrice(msg.sender)))
            revert InsufficientFeePaid(); 
        
        emit Mint(msg.sender, to, msg.value, numberMinted); 
        
        return numberMinted;
    }
    
    /**
     * @dev Contract owner can withdraw all collected funds from contract. 
     * 
     * @return True if successful. 
     */
    function withdrawAll() external returns (bool) {
        if(msg.sender != owner)
            revert NotAuthorized();
        
        uint256 amount = address(this).balance;
        (bool success,) = owner.call{value:amount}(""); 
        
        emit Withdraw(owner, amount, success);
        return success;
    }
    
    /**
     * @dev Returns either a custom or standard price as appropriate for the given 
     * recipient. 
     * 
     * @return price The appropriate price for the recipient. 
     */
    function getMintPrice(address /*buyer*/) internal view returns (uint256 price) {
        return mintPrice;
    }
}