const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

//TODO: test with receiver hook 

describe.skip("KrewnimeNFT: Transferring", function () {		  
	let nft;					//contracts
	let owner, addr1, addr2;	//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        nft.mintNext(owner.address); 
        nft.mintNext(owner.address); 
        nft.mintNext(owner.address); 
	});
	
	describe("Initial State", function() { 
		it("Initial balances", async function () {
            expect(await nft.balanceOf(owner.address)).to.equal(3); 
            expect(await nft.ownerOf(1)).to.equal(owner.address); 
            expect(await nft.ownerOf(2)).to.equal(owner.address); 
            expect(await nft.ownerOf(3)).to.equal(owner.address); 
		});
	});
	
	describe("Simple Transfer", function() {
		it("owner can transfer a token without data", async function () {
            await nft.transferFrom(owner.address, addr1.address, 1); 
            
            expect(await nft.balanceOf(owner.address)).to.equal(2); 
            expect(await nft.balanceOf(addr1.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
		});
          
		it("double transfer without data", async function () {
            await nft.transferFrom(owner.address, addr1.address, 1); 
            await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 1); 
            
            expect(await nft.balanceOf(owner.address)).to.equal(2); 
            expect(await nft.balanceOf(addr1.address)).to.equal(0); 
            expect(await nft.balanceOf(addr2.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr2.address); 
		});
	});
	
	describe("Approve and Transfer", function() {
		it("owner can approve", async function () {
            await nft.approve(addr1.address, 1); 
            expect(await nft.getApproved(1)).to.equal(addr1.address); 
		});
          
		it("approve and transfer", async function () {
            await nft.approve(addr1.address, 1); 
            await nft.connect(addr1).transferFrom(owner.address, addr1.address, 1); 
            
            expect(await nft.balanceOf(owner.address)).to.equal(2);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);
            expect(await nft.ownerOf(1)).to.equal(addr1.address);
		});
        
        it("approve and transfer to a third user", async function () {
            await nft.approve(addr1.address, 1); 
            await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1); 
            
            expect(await nft.balanceOf(owner.address)).to.equal(2); 
            expect(await nft.balanceOf(addr2.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr2.address);
        }); 
        
        it("cannot approve and double transfer", async function () {
            await nft.approve(addr1.address, 1);
            await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1); 
            
            await expect(
                nft.connect(addr1).transferFrom(addr2.address, addr1.address, 1)
            ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
            
            expect(await nft.balanceOf(owner.address)).to.equal(2); 
            expect(await nft.balanceOf(addr2.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr2.address);
        }); 
	});
	
	describe("Exceptional Cases", function() {
        it("non-owner cannot transfer a token", async function () {
            await expect(
                nft.transferFrom(addr1.address, addr2.address, 1)
            ).to.be.revertedWith("ERC721: transfer from incorrect owner"); 
        }); 
        
        it("non-owner cannot approve a token transfer", async function () {
            await expect(
                nft.connect(addr1).approve(addr2.address, 1)
            ).to.be.revertedWith("ERC721: approve caller is not token owner nor approved for all"); 
        }); 
        
        it("cannot approve self", async function () {
            await expect(
                nft.approve(owner.address, 1)
            ).to.be.revertedWith("ERC721: approval to current owner"); 
        }); 
	});
});