const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

describe.skip("KrewnimeNFT: Supply Constraints", function () {		  
	let nft;				        //contracts
	let owner, addr1, addr2; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        await nft.setMaxSupply(constants.COLLECTION_SIZE * 2); 
	});
    
	describe("Initial State", function () {
		it("property values", async function () {
			expect(await nft.maxSupply()).to.equal(constants.COLLECTION_SIZE * 2); 
			expect(await nft.collectionSize()).to.equal(constants.COLLECTION_SIZE); 
		});
    });  
    
	describe("Max Supply Constraints", function () {
		it("cannot mint more than max supply", async function () {
            await nft.multiMint(owner.address, constants.COLLECTION_SIZE); 
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            
            await expect(nft.mintNext(addr2.address)).to.be.reverted;
		});
    });  
    
	describe("Max Per User Constraints", function () {
		it("cannot mint more than collection size per user", async function () {
            await nft.initialMint(); 
            
            await expect(nft.multiMint(addr1.address, constants.COLLECTION_SIZE+1)).to.be.reverted;
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            await expect(nft.mintNext(addr1.address)).to.be.reverted;
		});
        
		it("user balance won't exceed collection size on multi-mint", async function () {
            await nft.initialMint(); 
            
            await nft.mintNext(addr1.address); 
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            expect(await nft.balanceOf(addr1.address)).to.be.equal(constants.COLLECTION_SIZE); 
		});
    });  
});