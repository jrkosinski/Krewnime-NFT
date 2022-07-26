const Deployer = require("./deployer");
const Runner = require("./lib/runner");

const NFT_ADDR = "0x8f6D93283aB1dC0656bDA558dF9d12C211303ea6";

Runner.run(async (provider, owner) => {

    console.log(' * * * ');
    console.log("Getting Krewnime NFT");
    console.log("");

    //get NFT contract 
    const nft = await ethers.getContractAt("KrewnimeNFT", NFT_ADDR); 

    console.log(' * * * ');
    console.log("");

    console.log(`base uri: ${await nft.baseUri()}`);
    console.log(`max supply: ${await nft.maxSupply()}`);
    console.log(`collection size: ${await nft.collectionSize()}`);
    console.log("");

    const royalties = await nft.getRoyaltyInfo();
    console.log(`royalties are set to [${royalties[1]}/${royalties[2]}], and will be paid to ${royalties[0]}`);
});

