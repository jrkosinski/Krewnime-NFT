const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

const provider = waffle.provider;

describe(constants.TOKEN_CONTRACT_ID + ": Store", function () {
    let nft, store;		        //contracts
    let owner, addr1, addr2; 	//accounts

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        //contract
        nft = await deploy.deployNFT();

        store = await deploy.deployStore(nft.address);
    });

    describe("Initial State", function () {
        it("property values", async function () {
            expect(await store.mintPrice()).to.equal(constants.MINT_PRICE);
            expect(await store.nftContract()).to.equal(nft.address);
        });
    });

    describe("Access", function () {
        it("owner can set price", async function () {
            await store.setMintPrice(constants.MINT_PRICE + 1);
            expect(await store.mintPrice()).to.equal(constants.MINT_PRICE + 1);
        });

        it("non-owner cannot set price", async function () {
            await expect(store.connect(addr1).setMintPrice(constants.MINT_PRICE + 1)).to.be.revertedWith("NotAuthorized()");
        });
    });

    describe("Designated Minter", function () {
        beforeEach(async function () {
            await nft.setMinter(store.address);
        });

        it("store can mint", async function () {
            await store.connect(addr1).mintNext(addr1.address, { value: constants.MINT_PRICE });
            expect(await (nft.balanceOf(addr1.address))).to.equal(1);
        });

        it("store cannot mint without minter role", async function () {
            await nft.setMinter(constants.ZERO_ADDRESS);
            await expect(
                store.connect(addr1).mintNext(addr1.address, { value: constants.MINT_PRICE })
            ).to.be.revertedWith("NotAuthorized()");
        });
    });

    describe("Purchasing Mints", function () {
        beforeEach(async function () {
            await nft.setMinter(store.address);
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
                store.connect(addr1).mintNext(addr1.address, { value: constants.MINT_PRICE - 1 })
            ).to.be.revertedWith("InsufficientFeePaid()");
        });

        it("store won't multi-mint if the price is not paid", async function () {
            await expect(
                store.connect(addr1).multiMint(addr1.address, 2, { value: constants.MINT_PRICE })
            ).to.be.revertedWith("InsufficientFeePaid()");
        });
    });

    describe("Withdraw Funds", function () {
        this.beforeEach(async function () {
            await nft.setMinter(store.address);
            await store.connect(addr1).multiMint(addr1.address, 3, { value: constants.MINT_PRICE * 3 });
        });

        it("owner can withdraw funds", async function () {
            expect(await provider.getBalance(store.address)).to.equal(constants.MINT_PRICE * 3);
            await store.connect(owner).withdrawAll();
            expect(await provider.getBalance(store.address)).to.equal(0);
        });

        it("non-owner cannot withdraw funds", async function () {
            expect(await provider.getBalance(store.address)).to.equal(constants.MINT_PRICE * 3);
            await expect(store.connect(addr1).withdrawAll()).to.be.revertedWith("NotAuthorized()");
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
                store.connect(addr1).multiMint(addr2.address, 2, { value: constants.MINT_PRICE * 2 }),
                "Mint", [addr1.address, addr2.address, constants.MINT_PRICE * 2, 2]);
        });

        it("withdraw emits Withdraw event", async function () {
            await nft.setMinter(store.address);
            await store.connect(addr1).multiMint(addr1.address, 3, { value: constants.MINT_PRICE * 3 });

            testEvent(async () =>
                store.withdrawAll(),
                "Withdraw", [owner.address, constants.MINT_PRICE * 3, true]);
        });
    });
});