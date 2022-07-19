require("@nomiclabs/hardhat-waffle");
require("solidity-coverage"); 

const ALCHEMY_API_KEY = "<ALCHEMY_KEY>";
const RINKEBY_PRIVATE_KEY = "<PRIVATE_KEY>";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${RINKEBY_PRIVATE_KEY}`]
    }
  }
};



