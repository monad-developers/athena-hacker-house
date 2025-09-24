import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const MONAD_RPC = process.env.MONAD_RPC || "http://127.0.0.1:8545"; // placeholder / local
const PRIVATE_KEY = process.env.DEPLOYER_KEY || "0x59c6995e998f97a5a0044976f8e017b5f5dc0a21b1b8b4d3e70f7a3a8a6a5f7d"; // Hardhat default key

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 2000 },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: MONAD_RPC,
      accounts: [PRIVATE_KEY],
    },
    monadTestnet: {
      url: MONAD_RPC,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      monad: process.env.ETHERSCAN_API_KEY || "",
    },
  },
};

export default config;


