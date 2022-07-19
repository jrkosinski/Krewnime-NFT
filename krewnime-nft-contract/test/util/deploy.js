
const constants = require("./constants");
const utils = require("../../scripts/lib/utils");

module.exports = {
    deployNFT : async () => {
		return await utils.deployContractSilent("KrewnimeNFT", [
            "0x0000000000000000000000000000000000000000",
            constants.NAME, 
            constants.SYMBOL, 
            constants.MAX_SUPPLY, 
            constants.COLLECTION_SIZE, 
            constants.BASE_URI
        ]); 
    }
};