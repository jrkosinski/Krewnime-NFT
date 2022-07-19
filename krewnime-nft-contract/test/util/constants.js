module.exports = {
    BASE_URI : "ipfs://ipfs_file_hash/",
    MAX_SUPPLY : 5, 
    COLLECTION_SIZE : 5, 
    NAME : "KrewnimeTest", 
    SYMBOL : "KRW", 
    MINT_PRICE: 10000000000,
    
    roles: {
        ADMIN: ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32),
        MINTER: '0x4d494e5445520000000000000000000000000000000000000000000000000000'
    }, 
    
    //TODO: can these be calculated? 
    interfaceIds : {
        IERC2981:           "0x2a55205a", 
        IERC165:            "0x01ffc9a7", 
        IAccessControl:     "0x7965db0b", 
        IERC721:            "0x80ac58cd", 
        IERC721Enumerable:  "0x780e9d63", 
        IERC20:             "0x36372b07", 
        IERC777:            "0xe58e113c"
    }
};