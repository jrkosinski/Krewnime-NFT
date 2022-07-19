// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./openzeppelin/security/Pausable.sol";
import "./openzeppelin/access/Ownable.sol";
import "./IMintable.sol";

/**
 * @title Krewnime NFT Collection Store
 * @author John R. Kosinski 
 * 
 * Minting/sale of NFT. 
 * 
 * The specs of this project are simple; the owner wants to be able to mint all tokens at once
 * or individually, with the option to (a) add more tokens in the future, and mint them, and 
 * (b) to create a new version of the contract if desired. 
 */
contract NFTStore is Pausable, Ownable {
    IMintable public nftContract; 
    uint256 public mintPrice = 0; 
    mapping(address => uint256) private specialPrices;
    
    /**
     * @dev Constructor. 
     * @param _nftContract The address of the NFT contract whose items are being sold. 
     * @param _mintPrice The price charged per unit to mint. 
     */
    constructor(IMintable _nftContract, uint256 _mintPrice) {
        nftContract = _nftContract;
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Owner can set the price to mint an NFT. 
     * 
     * @param _mintPrice The price to set. 
     */
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Owner can pause execution. 
     */
    function pause() external onlyOwner {
        _pause(); 
    }
    
    /**
     * @dev Owner can unpause execution if paused. 
     */
    function unpause() external onlyOwner {
        _unpause(); 
    }
    
    /**
     * Owner can set custom prices for specific address recipients. 
     * 
     * @param to The recipient for whom to set a custom price. 
     * @param price The price to set for the given recipient. 
     */
    function setSpecialPrice(address to, uint256 price) external onlyOwner {
        specialPrices[to] = price;
    }
    
    /**
     * Owner can set clear a custom price set previously for a recipient. 
     * 
     * @param to The recipient for whom to clear a custom price. 
     */
    function clearSpecialPrice(address to) external onlyOwner {
        specialPrices[to] = 0;
    }
    
    /**
     * @dev Anyone can purchase the right to mint, and mint an NFT from contract. 
     * 
     * @param to The NFT token recipient. 
     * @return tokenId The ID of the minted token. 
     */
    function mintNext(address to) external payable returns(uint256) {
        require(address(nftContract) != address(0), "NFTStore: NFT address not set");
        require(msg.value >= getMintPrice(to), "NFTStore: transferred value less than price");
        
        return nftContract.mintNext(to); 
    }
    
    /**
     * @dev Sell multiple mints in the collection to a single user. Will be reverted if the 
     * number to be minted exceeds the number allowed.
     * 
     * @param to The NFT token recipient. 
     * @return The number minted and sold. 
     */
    function multiMint(address to, uint256 count) external payable returns (uint256) {
        require(address(nftContract) != address(0), "NFTStore: NFT address not set");
        
        uint256 numberMinted = nftContract.multiMint(to, count); 
        require(msg.value >= (numberMinted * getMintPrice(to)), "NFTStore: transferred value less than price");
        return numberMinted;
    }
    
    /**
     * @dev Contract owner can withdraw all collected funds from contract. 
     * 
     * @return True if successful. 
     */
    function withdrawAll() external onlyOwner returns (bool) {
        (bool success,) = msg.sender.call{value:address(this).balance}(""); 
        return success;
    }
    
    /**
     * @dev Returns either a custom or standard price as appropriate for the given 
     * recipient. 
     * 
     * @param to The recipient for whom to get mint price. 
     * @return price The appropriate price for the recipient. 
     */
    function getMintPrice(address to) internal view returns (uint256 price) {
        price = specialPrices[to]; 
        if (price == 0) 
            price = mintPrice;
        else if (price > mintPrice) 
            price = mintPrice;
    }
}