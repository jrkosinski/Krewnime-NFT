const { ethers } = require("hardhat");
const Runner = require("./lib/runner");
    
const NFT_ADDR = "0xbDa572e1715304dc30BA2dE3293DeE390Be2F393"; 

Runner.run(async (provider, owner) => {
    
    console.log(' * * * '); 
    console.log("Minting Krewnime NFT"); 
    console.log(""); 
    
    //get NFT contract 
    const nft = await ethers.getContractAt("KrewnimeNFT", NFT_ADDR); 
    
    await nft.initialMint(); 
    
    console.log(`supply belonging to contract admin is ${await nft.balanceOf(owner.address)}`);
});

