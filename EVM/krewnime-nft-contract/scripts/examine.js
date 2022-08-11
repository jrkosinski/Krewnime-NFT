const Deployer = require("./deployer");
const Runner = require("./lib/runner");
const constants = require("./constants"); 

//deployed token address goes here 
const NFT_ADDR = "0xb454834F52107489E21b4Bcac42DA8E0dDdE7e7e";

/**
 * Displays some information about the token contract. 
 */
Runner.run(async (provider, owner) => {

    console.log(' * * * ');
    console.log("Getting ", constants.TOKEN_CONTRACT_ID); 
    console.log("");

    //get NFT contract 
    const nft = await ethers.getContractAt(constants.TOKEN_CONTRACT_ID, NFT_ADDR);    

    console.log(' * * * ');
    console.log("");

    console.log(`base uri: ${await nft.baseUri()}`);
    console.log(`max supply: ${await nft.maxSupply()}`);
    console.log(`collection size: ${await nft.collectionSize()}`);
    console.log("");

    const royalties = await nft.getRoyaltyInfo();
    console.log(`royalties are set to [${royalties[1]}/${royalties[2]}], and will be paid to ${royalties[0]}`);
});

