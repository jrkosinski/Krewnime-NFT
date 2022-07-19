const utils = require("./lib/utils");
const { ethers } = require("hardhat");

const BASE_URI = "ipfs://QmfPGLQPbfhfW1gA6bTqLa1R5RUmfPVcyRdaCGZhF8rAob/"; 
const MAX_SUPPLY = 10; 
const COLLECTION_SIZE = 10;

module.exports = {
    deployNFT: async () => {
        return await utils.deployContractSilent("KrewnimeNFT", [
            "0x0000000000000000000000000000000000000000",
            "Krewnime NFT", 
            "KRW",
            MAX_SUPPLY, 
            COLLECTION_SIZE,
            BASE_URI
        ]); 
    }, 
    
    deployStore: async (nftAddr) => {
        return await utils.deployContractSilent("NFTStore", [
            nftAddr, 
            ethers.utils.parseEther("0.0065")
        ]); 
    }
};

