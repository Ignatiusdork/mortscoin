// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MortsCoin is ERC20, Ownable {

  // price of one Mort's Coin
  uint256 public constant coinPrice = 0.001 ether;

  // the max total supply is 10000 for Mort's Coin
  uint256 public constant maxTotalSupply = 10000 * 10 ** 18;

  // Constructor for the token details to passed once the token is depolyed
  constructor() ERC20("MortsToken", "MRT") {}

  /**
    * @dev Mints `amount` number of CryptoDevTokens
    * Requirements:
    * - `msg.value` should be equal or greater than the tokenPrice * amount
  */

  function mint(uint256 amount) public payable {

    // the value of ether should equal or greater than tokenprice * amount;
    uint256 _requiredAmount = coinPrice * amount;
    require(msg.value >= _requiredAmount, "Ether sent is incorrect");

    // total tokens + amount <= 10000, otherwise revert the transaction
    uint256 amountWithDecimals = amount * 10**18;
    require(
      (totalSupply() + amountWithDecimals) <= maxTotalSupply,
      "Exceeds the max total supply available."
    );

    // call the internal function from openzippilen's ERC20 contract
    _mint(msg.sender, amountWithDecimals);
  }

  /**
    * @dev withdraws all ETH sent to this contract
    * Requirements:
    * wallet connected must be owner's address
  */

  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    require(amount > 0, "Nothing to withdraw, contrsct balance empty");

    address _owner = owner();
    (bool sent, ) = _owner.call{value: amount}("");
    require(sent, "Failed to send Ether");
  }

  // Function to receive Ether, msg.data must be empty
  receive() external payable{}

  //Fallback function is called when msg.data is not empty
  fallback() external payable {}
}
