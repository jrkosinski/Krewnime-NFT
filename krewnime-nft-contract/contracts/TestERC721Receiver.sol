// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./openzeppelin/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol"; 


/**
 * @title The Krewnime NFT Collection 
 * @author John R. Kosinski 
 * 
 * This is used for testing the ERC721 receiver abilities of standard ERC721. 
 * Used only in unit tests. 
 */
contract TestERC721Receiver is IERC721Receiver {

    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;
    bool public received = false;
    
    enum Behavior {
        Acknowledge, 
        Revert,
        Reject
    }
    
    event Received (
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );
    
    Behavior private behavior = Behavior.Acknowledge; 
    
    function setBehavior(Behavior _behavior) external {
        behavior = _behavior;
    }
    
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data) external override(IERC721Receiver) returns (bytes4) {
        received = true; 
        
        emit Received(operator, from, tokenId, data); 
        
        if (behavior == Behavior.Acknowledge) {
            return 0x150b7a02; 
        }
        else if (behavior == Behavior.Revert) {
            revert("aaaaaaa"); 
        }
            
        return 0x00000101;
    }
}