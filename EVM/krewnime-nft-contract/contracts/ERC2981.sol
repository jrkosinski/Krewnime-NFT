// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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
 * - changing the collection size (adding to the collection) 
 * - receiving royalties (ERC-2981) 
 * - enumerable 
 * - mintable 
 * - burnable 
 * - URI storage 
 * - ADMIN and MINTER security roles 
 *
 */
contract ERC2981 {
    
    //royalties (ERC-2981 implementation) - default to 0%
    RoyaltyData internal royaltyData; 
    
    struct RoyaltyData {
        address receiver; 
        uint96 feeNumerator;
        uint96 feeDenominator;
    }
    
    event RoyaltyInfoChanged (
        address receiver, 
        uint96 feeNumerator,
        uint96 feeDenominator
    ); 
    
    /**
     * @dev ERC-2981: Sets the receiver and percentage for royalties for secondary sales on exchanges. 
     *
     * @param receiver The address to receive royalty payments. 
     * @param feeDenominator- 
     * @param feeNumerator -
     */
    function setRoyaltyInfo(address receiver, uint96 feeNumerator, uint96 feeDenominator) public virtual {
        royaltyData.receiver = receiver; 
        royaltyData.feeNumerator = feeNumerator; 
        royaltyData.feeDenominator = feeDenominator; 
        
        emit RoyaltyInfoChanged(receiver, feeNumerator, feeDenominator);
    }
    
    /**
     * @dev ERC-2981: Gets the state information related to royalties on secondary sales.
     * 
     * @return receiver The address to receive royalty payments. 
     * @return feeNumerator []
     * @return feeDenominator []
     */
    function getRoyaltyInfo() public virtual view returns (address receiver, uint96 feeNumerator, uint96 feeDenominator) {
        return (royaltyData.receiver, royaltyData.feeNumerator, royaltyData.feeDenominator);
    }
    
    /**
     * @dev ERC-2981: Disables royalty payments. Enable them by calling setRoyaltyInfo. 
     */
    function clearRoyaltyInfo() public virtual {
        royaltyData.receiver = address(0); 
        royaltyData.feeNumerator = 0; 
        royaltyData.feeDenominator = 0; 
    }
    
    /**
     * @dev ERC-2981 implementation; provides royalty information to exchanges who may or may not use this 
     * to award royalty percentages for future resales. This will return 0x0... for address and 0 
     * for amount if royalties are not enabled for this contract. 
     * Royalties are the same for all token IDs. 
     * 
     * @return receiver The address to receive the royalty fee. 
     * @return amount The amount of royalty as a percentage of the sale price. 
     */
    function _royaltyInfo(uint256 /*_tokenId*/, uint256 _salePrice) public view virtual returns (address receiver, uint256 amount) {
        amount = 0;
        receiver = royaltyData.receiver;
        
        if (receiver != address(0) && royaltyData.feeDenominator  != 0) {
            amount = (_salePrice * royaltyData.feeNumerator ) / royaltyData.feeDenominator ;
        }
    }
}