const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

describe.skip("KrewnimeNFT: Basic", function () {		  
	let nft;				//contracts
	let owner, addr1; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
	
	describe("Initial State", function () {
		it("property values", async function () {
			expect(await nft.maxSupply()).to.equal(constants.MAX_SUPPLY); 
			expect(await nft.collectionSize()).to.equal(constants.COLLECTION_SIZE); 
			expect(await nft.baseUri()).to.equal(constants.BASE_URI); 
			expect(await nft.name()).to.equal(constants.NAME); 
			expect(await nft.symbol()).to.equal(constants.SYMBOL); 
		});
        
		it("balances", async function () {
			expect(await nft.totalSupply()).to.equal(0); 
			expect(await nft.balanceOf(owner.address)).to.equal(0); 
			expect(await nft.balanceOf(addr1.address)).to.equal(0); 
		});
        
		it("access", async function () {
			expect(await nft.hasRole(constants.roles.ADMIN, owner.address)).to.equal(true);
			expect(await nft.hasRole(constants.roles.MINTER, owner.address)).to.equal(true);
		});
    });  
	
	describe("Set/Read Properties", function () {
		it("max supply", async function () {
            const newSupply = constants.MAX_SUPPLY + 1;
            await nft.setMaxSupply(newSupply);
			expect(await nft.maxSupply()).to.equal(newSupply); 
		});
		
		it("collection size", async function () {
            const newSize = constants.COLLECTION_SIZE + 1;
            await nft.setCollectionSize(newSize);
			expect(await nft.collectionSize()).to.equal(newSize); 
		});
        
		it("base URI", async function () {
            const newBaseUri = "NEW_BASE_URI";
            await nft.setBaseUri(newBaseUri);
			expect(await nft.baseUri()).to.equal(newBaseUri); 
		});
    });  
});