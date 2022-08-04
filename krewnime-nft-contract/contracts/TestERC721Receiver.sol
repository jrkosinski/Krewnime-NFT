// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./openzeppelin/token/ERC721/IERC721Receiver.sol";

/**
 * @title The Krewnime NFT Collection 
 * @author John R. Kosinski 
 * 
 * This is used for testing the ERC721 receiver abilities of standard ERC721. 
 * Used only in unit tests. 
 */
contract TestERC721Receiver is IERC721Receiver {

    bool public received = false; //will be true if onERC721Received was called and not reverted
    
    enum Behavior {
        Acknowledge,    //receives and returns correct value from onERC721Received
        Revert,         //actively reverts in onERC721Received
        Reject          //returns incorrect value from onERC721Received
    }
    
    /**
     * Emitted from onERC721Received. 
     */
    event Received (
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );
    
    Behavior private behavior = Behavior.Acknowledge; 
    
    /**
     * Determines the test receiver's behavior upon receiving; it will either accept the 
     * receive, revert it, or reject it (by returning an incorrect return value). 
     */
    function setBehavior(Behavior _behavior) external {
        behavior = _behavior;
    }
    
    /**
     * Implementation of ERC721 receiver hook function. 
     */
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