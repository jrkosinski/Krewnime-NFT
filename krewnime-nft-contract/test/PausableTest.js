const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

describe("KrewnimeNFT: Pausable", function () {		  
	let nft;				//contracts
	let owner, addr1; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
	
	describe("Initial State", function () {
		it("is not paused", async function () {
			expect(await nft.paused()).to.equal(false); 
		});		
    });  
	
	describe("Pause can be called", function() {
		it("owner can pause", async function () {
            await nft.pause();
            expect(await nft.paused()).to.equal(true);
		});
        
		it("owner can unpause", async function () {
            await nft.pause();
            expect(await nft.paused()).to.equal(true);
            await nft.unpause();
            expect(await nft.paused()).to.equal(false);
		});
        
		it("cannot unpause when not paused", async function () {
            expect(await nft.paused()).to.equal(false);
            await expect(nft.unpause()).to.be.revertedWith("Pausable: not paused"); 
		});
        
		it("non-owner cannot pause", async function () {
            await expect(nft.connect(addr1).pause()).to.be.reverted; 
		});
	});
	
	describe("Behavior while Paused", function() {        
		it("cannot pause when paused", async function () {
            await nft.pause();
            expect(await nft.paused()).to.equal(true);
            await expect(nft.pause()).to.be.revertedWith("Pausable: paused"); 
		});
        
		it("cannot mint when paused", async function () {
            await nft.pause();
            expect(await nft.paused()).to.equal(true);
            await expect(nft.mintNext(addr1.address)).to.be.revertedWith("Pausable: paused"); 
		});
        
		it("cannot transfer when paused", async function () {
            await nft.mintNext(owner.address); 
            await nft.pause();
            expect(await nft.paused()).to.equal(true);
            await expect(nft.transferFrom(owner.address, addr1.address, 1)).to.be.revertedWith("Pausable: paused"); 
		});
    });

    describe("Events", function () {
        it('paused event fires on pause', async () => {
            testEvent(async () => await nft.pause(),
                "Paused", [owner.address]);
        });

        it('unpaused event fires on unpause', async () => {
            await nft.pause(); 
            testEvent(async () => await nft.unpause(),
                "Unpaused", [owner.address]);
        });
    });
});