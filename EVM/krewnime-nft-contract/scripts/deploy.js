const Deployer = require("./deployer");
const Runner = require("./lib/runner");

const MINTER_ROLE = '0x4d494e5445520000000000000000000000000000000000000000000000000000'; 

Runner.run(async (provider, owner) => {
    
    console.log(' * * * '); 
    console.log("Deploying Krewnime NFT"); 
    console.log(""); 
    
    //deploy NFT contract 
    const nft = await Deployer.deployNFT();
    console.log(`NFT address is ${nft.address}`);
    
    //deploy store contract 
    const store = await Deployer.deployStore(nft.address); 
    console.log(`NFT store address is ${store.address}`);
    
    console.log(' * * * '); 
    console.log(""); 
    
    console.log(`base uri: ${await nft.baseUri()}`);
    console.log(`max supply: ${await nft.maxSupply()}`);
    console.log(`collection size: ${await nft.collectionSize()}`);
    console.log(""); 
    
    //set royalty info to 0.5% 
    await nft.setRoyaltyInfo(owner.address, 5, 1000); 
    const royalties = await nft.getRoyaltyInfo(); 
    console.log(`royalties are set to [${royalties[1]}/${royalties[2]}], and will be paid to ${royalties[0]}`);
    
    //set the store as a minter 
    await nft.grantRole(MINTER_ROLE, store.address); 
});

