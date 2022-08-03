const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

const provider = waffle.provider;

describe("KrewnimeNFT: Store", function () {		  
	let nft, store;		        //contracts
	let owner, addr1, addr2; 	//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        store = await utils.deployContractSilent(constants.STORE_CONTRACT_ID, [nft.address, constants.MINT_PRICE]); 
	});
	
	describe("Initial State", function () {
		it("property values", async function () {
			expect(await store.mintPrice()).to.equal(constants.MINT_PRICE); 
            expect(await store.nftContract()).to.equal(nft.address);
            expect(await store.paused()).to.equal(false); 
            expect(await store.mintPrice()).to.equal(constants.MINT_PRICE); 
		});
    });  
	
	describe("Access", function () {
		it("owner can set price", async function () {
            await store.setMintPrice(constants.MINT_PRICE+1); 
			expect(await store.mintPrice()).to.equal(constants.MINT_PRICE+1); 
		});
        
		it("non-owner cannot set price", async function () {
            await expect(store.connect(addr1).pause(constants.MINT_PRICE+1)).to.be.reverted;
        });
        
        it("non-owner cannot set special price", async function () {
            await expect(store.setSpecialPrice(addr1.address, 1)).to.not.be.reverted;
            await expect(store.connect(addr1).setSpecialPrice(addr1.address, 1)).to.be.reverted;
        });

        it("non-owner cannot clear special price", async function () {
            await expect(store.setSpecialPrice(addr1.address, 1)).to.not.be.reverted;
            await expect(store.connect(addr1).clearSpecialPrice(addr1.address)).to.be.reverted;
            await expect(store.clearSpecialPrice(addr1.address)).to.not.be.reverted;
        });

        it("owner can pause", async function () {
            await store.pause(); 
            expect (await store.paused()).to.equal(true); 
        });

        it("non-owner cannot pause", async function () {
            await expect(store.connect(addr1).pause()).to.be.reverted;
        });

        it("owner can unpause", async function () {
            await store.pause();
            expect(await store.paused()).to.equal(true);

            await store.unpause();
            expect(await store.paused()).to.equal(false);
        });

        it("non-owner cannot unpause", async function () {
            await store.pause();
            await expect(store.connect(addr1).unpause()).to.be.reverted;
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

        it("store cannot mint without minter role", async function () {
            await nft.revokeRole(constants.roles.MINTER, store.address);
            await expect(
                store.connect(addr1).mintNext(addr1.address, { value: constants.MINT_PRICE })
            ).to.be.reverted;
        });
    });  
    
    describe("Purchasing Mints", function () {
        beforeEach(async function () {
            await nft.grantRole(constants.roles.MINTER, store.address);
        });
        
        it("can purchase a mint", async function () {
            await store.connect(addr1).mintNext(addr1.address, { value: constants.MINT_PRICE });
            expect(await (nft.balanceOf(addr1.address))).to.equal(1); 
        }); 

        it("can purchase multiple mints", async function () {
            await store.connect(addr1).multiMint(addr1.address, 3, { value: constants.MINT_PRICE * 3 });
            expect(await (nft.balanceOf(addr1.address))).to.equal(3); 
        }); 

        it("store won't mint if the price is not paid", async function () {
            await expect(
                store.connect(addr1).mintNext(addr1.address, { value: constants.MINT_PRICE-1 })
            ).to.be.reverted;
        });

        it("store won't multi-mint if the price is not paid", async function () {
            await expect(
                store.connect(addr1).multiMint(addr1.address, 2, { value: constants.MINT_PRICE })
            ).to.be.reverted;
        }); 
    });

    //TODO: finish test cases 
    describe("Special Prices", function () {
        it("set and pay discounted price", async function () {
        }); 
    });

    describe("Paused Behavior", function () {
        it("cannot mint when paused", async function () {
        }); 

        it("cannot multi-mint when paused", async function () {
        });

        it("cannot withdraw when paused", async function () {
        }); 
    });

    describe("Withdraw Funds", function () {
        this.beforeEach(async function () {
            await nft.grantRole(constants.roles.MINTER, store.address);
            await store.connect(addr1).multiMint(addr1.address, 3, { value: constants.MINT_PRICE * 3 });
        });
        
        it("owner can withdraw funds", async function () {
            expect(await provider.getBalance(store.address)).to.equal(constants.MINT_PRICE * 3);
            await store.connect(owner).withdrawAll(); 
            expect(await provider.getBalance(store.address)).to.equal(0);
        }); 

        it("non-owner cannot withdraw funds", async function () {
            expect(await provider.getBalance(store.address)).to.equal(constants.MINT_PRICE * 3);
            await expect(store.connect(addr1).withdrawAll()).to.be.reverted;
        }); 
    });

    describe("Events", function () {
        it("minting emits Mint event", async function () {
            testEvent(async () => 
                store.connect(addr1).mintNext(addr2.address, { value: constants.MINT_PRICE }),
                "Mint", [addr1.address, addr2.address, constants.MINT_PRICE, 1]);
        }); 

        it("multi-minting emits Mint event", async function () {
            testEvent(async () =>
                store.connect(addr1).multiMint(addr2.address, 2, { value: constants.MINT_PRICE*2 }),
                "Mint", [addr1.address, addr2.address, constants.MINT_PRICE*2, 2]);
        });

        it("withdraw emits Withdraw event", async function () {
            await nft.grantRole(constants.roles.MINTER, store.address);
            await store.connect(addr1).multiMint(addr1.address, 3, { value: constants.MINT_PRICE * 3 });
            
            testEvent(async () =>
                store.withdrawAll(),
                "Withdraw", [owner.address, constants.MINT_PRICE * 3, true]);
        }); 
    });
});