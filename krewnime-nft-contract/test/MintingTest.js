const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

describe("KrewnimeNFT: Minting", function () {
    let nft;                    //contracts
    let owner, addr1, addr2;    //addresses
    
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
    
    describe("Single Minting", function() {
        it("mint a token to owner", async function () {
            await nft.mintNext(owner.address); 
            
            //owner should have gotten one token 
            expect(await nft.balanceOf(owner.address)).to.equal(1); 
            expect(await nft.balanceOf(addr1.address)).to.equal(0); 
            expect(await nft.ownerOf(1)).to.equal(owner.address); 
        }); 
        
        it("mint a token to non-owner", async function () {
            await nft.mintNext(addr1.address); 
            
            //addr1 should have gotten one token 
            expect(await nft.balanceOf(addr1.address)).to.equal(1); 
            expect(await nft.balanceOf(owner.address)).to.equal(0); 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
        }); 
        
        it("non-owner cannot mint token", async function () {
            await expect(nft.connect(addr1).mintNext(
                addr1.address)
            ).to.be.reverted; 
        }); 
        
        it("cannot get balance of nonexistent token", async function () {
            await expect(nft.ownerOf(1)).to.be.reverted;
        }); 
        
        it("can mint multiple tokens to same owner", async function () {
            //mint 2 
            await nft.mintNext(addr1.address); 
            await nft.mintNext(addr1.address); 
            
            //addr1 should have 2 
            expect(await nft.balanceOf(addr1.address)).to.equal(2); 
            expect(await nft.balanceOf(addr2.address)).to.equal(0); 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
            expect(await nft.ownerOf(2)).to.equal(addr1.address); 
        }); 
        
        it("can mint multiple tokens to different owners", async function () {
            //mint 1 to each 
            await nft.mintNext(addr1.address); 
            await nft.mintNext(addr2.address); 
            
            //addr1 and addr2 should have one each 
            expect(await nft.balanceOf(addr1.address)).to.equal(1); 
            expect(await nft.balanceOf(addr2.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
            expect(await nft.ownerOf(2)).to.equal(addr2.address); 
        }); 
    }); 
    
    describe("Multiple Minting", function() {
        it("mint all to owner", async function() {
            await nft.initialMint(); 
            expect(await nft.balanceOf(owner.address)).to.equal(constants.COLLECTION_SIZE); 
        }); 
        
        it("initialMint can be only called once", async function() {
            await nft.initialMint(); 
            await expect(nft.initialMint()).to.be.reverted;
        }); 
        
        it("initialMint can only be called by owner/admin", async function() {
            await expect(nft.connect(addr1).initialMint()).to.be.reverted;
        }); 
        
        it("mint next in collection", async function() {
            const collectionSize = 4; 
            await nft.setCollectionSize(collectionSize); 
            
            //max supply is twice the collection size; so two sets can be minted
            await nft.setMaxSupply(collectionSize * 2);
            
            //mint one collection set to owner 
            await nft.initialMint(); 
            
            for (let n=1; n<=collectionSize; n++) {
                //mint one to a non-admin 
                await nft.mintNext(addr1.address);
                
                //ensure that recipient got the token 
                expect(await nft.ownerOf(collectionSize + n)).to.equal(addr1.address); 
                expect(await nft.balanceOf(addr1.address)).to.equal(n); 
            }
        }); 
        
        it("mint remaining in collection", async function () {
            const collectionSize = 4;
            await nft.setCollectionSize(collectionSize);

            //max supply is twice the collection size; so two sets can be minted
            await nft.setMaxSupply(collectionSize * 2);

            //mint one collection set to owner 
            await nft.initialMint(); 
            
            //mint next 1 
            await nft.mintNext(addr1.address);
            
            //then mint next 2 
            await nft.multiMint(addr1.address, 2); 
            
            expect(await nft.ownerOf(collectionSize + 1)).to.equal(addr1.address); 
            expect(await nft.ownerOf(collectionSize + 2)).to.equal(addr1.address); 
            expect(await nft.ownerOf(collectionSize + 3)).to.equal(addr1.address); 
            expect(await nft.balanceOf(addr1.address)).to.equal(3); 
        }); 
    }); 
    
    describe("Token URIs", function() {
        it("correct initial token URIs", async function() {
            await nft.initialMint(); 
            
            //check that token URIs are all as expected 
            for (let n=1; n<=constants.COLLECTION_SIZE; n++) {
                expect(await nft.tokenURI(n)).to.equal(constants.BASE_URI + n.toString() + ".json"); 
            }
        }); 
        
        it("correct multi-set token URIs", async function() {
            await nft.setMaxSupply(constants.COLLECTION_SIZE * 3);
            await nft.initialMint(); 
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            await nft.multiMint(addr2.address, constants.COLLECTION_SIZE); 

            //check that token URIs are all as expected when multiple sets are minted
            let tokenId = 1;
            for (let n=0; n<3; n++) {
                for (let i=1; i<=constants.COLLECTION_SIZE; i++) {
                    expect(await nft.tokenURI(tokenId)).to.equal(constants.BASE_URI + i.toString() + ".json"); 
                    tokenId++; 
                }
            }
        }); 
    });

    describe("Events", function () {
        it('transfer event fires on mint', async () => {
            testEvent(async () => await nft.mintNext(addr1.address),
                "Transfer", [owner.address, addr1.address, 1]);
        });
    });
}); 