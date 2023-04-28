const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });


async function main() {

  /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so cryptoDevsTokenContract here is a factory for instances of our CryptoDevToken contract.
  */
  const mortsCoinTokenContract = await ethers.getContractFactory("MortsCoin");

  // deploy the contract
  const deployedMortsCoinTokenContract = await mortsCoinTokenContract.deploy();

  await deployedMortsCoinTokenContract.deployed();

  // print the address of the deployed contract
  console.log(
    "Morts Coin Token Contract Address:", deployedMortsCoinTokenContract.address);
}

// Call the main function and catch if there is any error
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
