const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

describe.skip("KrewnimeNFT: Royalties (ERC-2981)", function () {		  
	let nft;				//contracts
	let owner, addr1; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
    
    function expectRoyaltiesZero(result) {
        expectRoyaltiesEqual(result, "0x0000000000000000000000000000000000000000", 0); 
    }
    
    function expectRoyaltiesDisabled(result) {
        expectRoyaltyInfoEqual(result, "0x0000000000000000000000000000000000000000", 0, 0); 
    }
    
    function expectRoyaltiesEqual(result, expectedReceiver, expectedAmount) {
        expect(result[0]).to.equal(expectedReceiver); 
        expect(result[1]).to.equal(expectedAmount); 
    }
    
    function expectRoyaltyInfoEqual(result, expectedReceiver, expectedNumerator, expectedDenominator) {
        expect(result[0]).to.equal(expectedReceiver); 
        expect(result[1]).to.equal(expectedNumerator); 
        expect(result[2]).to.equal(expectedDenominator); 
    }

	describe("Initial State", function () {
		it("royalty data not set by default", async function () {
            const result = await nft.getRoyaltyInfo(); 
            expectRoyaltiesDisabled(result); 
		});
    });  

	describe("Manage Royalty Info", function () {
		it("admin can set royalty info", async function () {
			const num = 3; 
			const denom = 1000; 
			
            await nft.setRoyaltyInfo(addr1.address, num, denom); 
			
            const result = await nft.getRoyaltyInfo(); 
			expectRoyaltyInfoEqual(result, addr1.address, num, denom); 
		});
		
		it("non-admin cannot set royalty info", async function () {
			await expect(nft.connect(addr1).setRoyaltyInfo(addr1.address, 1, 1)).to.be.reverted;
		}); 
        
		it("admin can clear royalty info", async function () {
			const num = 3; 
			const denom = 1000; 
			
            await nft.setRoyaltyInfo(addr1.address, num, denom); 
			
            let result = await nft.getRoyaltyInfo(); 
			expectRoyaltyInfoEqual(result, addr1.address, num, denom); 
			
			await nft.clearRoyaltyInfo(); 
			
            result = await nft.getRoyaltyInfo(); 
			expectRoyaltiesDisabled(result); 
		});
		
		it("non-admin cannot clear royalty info", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 1); 
			await expect(nft.connect(addr1).clearRoyaltyInfo()).to.be.reverted;
		}); 
    });  

	describe("Calculate Royalties", function () {
		it("zero sale price", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 100); 
			const result = await nft.royaltyInfo(1, 0); 
			expectRoyaltiesEqual(result, addr1.address, 0); 
		}); 
		
		it("zero numerator", async function () {
            await nft.setRoyaltyInfo(addr1.address, 0, 100); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, 0); 
		}); 
		
		it("zero denominator", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 0); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, 0); 
		}); 
		
		it("normal values: 3%", async function () {
            await nft.setRoyaltyInfo(addr1.address, 3, 100); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.03")); 
		}); 
		
		it("normal values: 1%", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 100); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.01")); 
		}); 
		
		it("normal values: 0.2%", async function () {
            await nft.setRoyaltyInfo(addr1.address, 2, 1000); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.002")); 
		}); 
		
		it("token id is ignored", async function () {
            await nft.setRoyaltyInfo(addr1.address, 3, 100); 
			const result = await nft.royaltyInfo(10100, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.03")); 
		}); 
    });  
});