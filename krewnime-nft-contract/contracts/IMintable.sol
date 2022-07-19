// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./openzeppelin/token/ERC721/ERC721.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import "./openzeppelin/security/Pausable.sol";
import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/utils/Counters.sol";
import "./openzeppelin/utils/Strings.sol";

/**
 * @title The Krewnime NFT Collection 
 * @author John R. Kosinski 
 * 
 * The specs of this project are simple; the owner wants to be able to mint all tokens at once
 * or individually, with the option to (a) add more tokens in the future, and mint them, and 
 * (b) to create a new version of the contract if desired. 
 */
interface IMintable  {

    /**
     * @dev Allows someone to mint. 
     * 
     * @param to The address of the token recipient once minted. 
     * @return The tokenId of the newly minted token.
     */
    function mintNext(address to) external returns (uint256);
    
    /**
     * @dev Allows someone to mint more than one item from the collection at once. 
     * 
     * @param to The address of the token recipient once minted. 
     * @param count The max number of tokens to be minted. 
     * @return The number of tokens minted to the recipient. 
     */
    function multiMint(address to, uint256 count) external returns (uint256);
}