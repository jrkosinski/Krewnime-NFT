const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

//TODO: add more coverage here

describe("KrewnimeNFT: Store", function () {		  
	let nft, store;		    //contracts
	let owner, addr1; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        store = await utils.deployContractSilent(constants.STORE_CONTRACT_ID, [nft.address, constants.MINT_PRICE]); 
	});
	
	describe("Initial State", function () {
		it("property values", async function () {
			expect(await store.mintPrice()).to.equal(constants.MINT_PRICE); 
			expect(await store.nftContract()).to.equal(nft.address); 
		});
    });  
	
	describe("Access", function () {
		it("owner can set price", async function () {
            await store.setMintPrice(constants.MINT_PRICE+1); 
			expect(await store.mintPrice()).to.equal(constants.MINT_PRICE+1); 
		});
        
		it("non-owner cannot set price", async function () {
            await expect(store.connect(addr1).setMintPrice(constants.MINT_PRICE+1)).to.be.reverted;
		});
    });  
    
	describe("Designated Minter", function () {
        beforeEach(async function () {
            await nft.grantRole(constants.roles.MINTER, store.address);
        });
        
		it("store can mint", async function () {
            await store.connect(addr1).mintNext(addr1.address, {value:constants.MINT_PRICE}); 
            expect(await(nft.balanceOf(addr1.address))).to.equal(1); 
		});
    });  
});