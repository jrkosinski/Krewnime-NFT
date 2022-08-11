const { ethers } = require("hardhat");
const Runner = require("./lib/runner");
const constants = require("./constants"); 

//deployed token address goes here 
const NFT_ADDR = "0xbDa572e1715304dc30BA2dE3293DeE390Be2F393";  //TODO: get from constants

/**
 * Runs the initialMint function directly on the token contract. 
 */
Runner.run(async (provider, owner) => {
    
    console.log(' * * * '); 
    console.log("Minting ", constants.TOKEN_CONTRACT_ID); 
    console.log(""); 
    
    //get NFT contract 
    const nft = await ethers.getContractAt(constants.TOKEN_CONTRACT_ID, NFT_ADDR);   
    
    //run initial mint
    await nft.initialMint(); 
    
    //verify 
    console.log(`supply belonging to contract admin is ${await nft.balanceOf(owner.address)}`);
});

