import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
    // Create a BigNumber '0'
    const zero = BigNumber.from(0);

    // walletConnected keeps track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false);

    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(false);

    // balanceOfMortsTokens keeps track of number of Morts tokens owned by an address
    const [balanceOfMortsTokens, setBalanceOfMortsTokens] = useState(zero);

    // amount of the tokens that the user wants to mint
    const [tokenAmount, setTokenAmount] = useState(zero);

    // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
    const [tokensMinted, setTokensMinted] = useState(zero);

    // isOwner gets the owner of the contract through the signed address
    const [isOwner, setIsOwner] = useState(false);
    
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef();

    /**
    * getBalanceOfMortsTokens: checks the balance of Crypto Dev Tokens's held by an address
    */
     const getBalanceOfMortsTokens = async () => {
      try {
        // Get the provider from web3Modal, which in our case is MetaMask
        // No need for the Signer here, as we are only reading state from the blockchain
        const provider = await getProviderOrSigner();
        // Create an instance of token contract
        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          provider
        );
        // We will get the signer now to extract the address of the currently connected MetaMask account
        const signer = await getProviderOrSigner(true);
        // Get the address associated to the signer which is connected to  MetaMask
        const address = await signer.getAddress();
        // call the balanceOf from the token contract to get the number of tokens held by the user
        const balance = await tokenContract.balanceOf(address);
        // balance is already a big number, so we dont need to convert it before setting it
        setBalanceOfMortsTokens(balance);
      } catch (err) {
        console.error(err);
        setBalanceOfMortsTokens(zero);
      }
    };

    /**
    * mintMortsToken: mints `amount` number of tokens to a given address
    */
    const mintMortsToken = async (amount) => {
      try {
        // We need a Signer here since this is a 'write' transaction.
        // Create an instance of tokenContract
        const signer = await getProviderOrSigner(true);
        // Create an instance of tokenContract
        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          signer
        );
        // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
        const value = 0.001 * amount;
        const tx = await tokenContract.mint(amount, {
          // value signifies the cost of one crypto dev token which is "0.001" eth.
          // We are parsing `0.001` string to ether using the utils library from ethers.js
          value: utils.parseEther(value.toString()),
        });
        setLoading(true);
        // wait for the transaction to get mined
        await tx.wait();
        setLoading(false);
        window.alert("Successfully minted Mort's Tokens");
        await getBalanceOfMortsTokens();
        await getTotalTokensMinted();
      } catch (err) {
        console.error(err);
      }
    };

    /**
     * getTotalTokensMinted: Retrieves how many tokens have been minted till now
     * out of the total supply
    */
     const getTotalTokensMinted = async () => {
      try {
        // Get the provider from web3Modal, which in our case is MetaMask
        // No need for the Signer here, as we are only reading state from the blockchain
        const provider = await getProviderOrSigner();
        // Create an instance of token contract
        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          provider
        );
        // Get all the tokens that have been minted
        const _tokensMinted = await tokenContract.totalSupply();
        setTokensMinted(_tokensMinted);
      } catch (err) {
        console.error(err);
      }
    };
  
    /**
    * getOwner: gets the contract owner by connected address
    */
    const getOwner = async () => {
      try {
        const provider = await getProviderOrSigner();
        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          provider
        );
        // call the owner function from the contract
        const _owner = await tokenContract.owner();
        // we get signer to extract address of currently connected Metamask account
        const signer = await getProviderOrSigner(true);
        // Get the address associated to signer which is connected to Metamask
        const address = await signer.getAddress();
        if (address.toLowerCase() === _owner.toLowerCase()) {
          setIsOwner(true);
        }
      } catch (err) {
        console.error(err.message);
      }
    };

    /**
     * withdrawCoins: withdraws ether by calling
     * the withdraw function in the contract
    */    
    // const withdrawCoins = async () => {
    //   try {
    //     const signer = await getProviderOrSigner(true);
    //     const tokenContract = new Contract(
    //       TOKEN_CONTRACT_ABI,
    //       TOKEN_CONTRACT_ADDRESS,
    //       signer
    //     );

    //     const tx = await tokenContract.withdraw();
    //     setLoading(true);
    //     await tx.wait();
    //     setLoading(false);
    //     await getOwner();
    //   } catch (err) {
    //     console.error(err);
    //     window.alert(err.reason);
    //   }
    // };

    /**
     * Returns a Provider or Signer object representing the Ethereum RPC with or without the
     * signing capabilities of metamask attached
     *
     * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
     *
     * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
     * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
     * request signatures from the user using Signer functions.
     *
    * @param {*} needSigner - True if you need the signer, default false otherwise
    */
    
    const getProviderOrSigner = async (needSigner = false) => {
      // Connect to Metamask
      // Since we atore `web3Modal` as a reference, we nees to acess the `current` value to get access to the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      // If user is not connected to the Sepolia network, let them know and throw an error
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 0xAA36A7 ) {
        window.alert("Change the network to Sepolia");
        throw new Error("Change network to Sepolia");
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    };

    // connectWallet: Connects the MetaMask wallet
    const connectWallet = async () => {
      try {
        // Get the provider from web3Modal, which in our case is MetaMask
        // When used for the first time, it promtes the user to connect thier wallet
        await getProviderOrSigner();
        setWalletConnected(true);
      } catch (err) {
        console.error(err);
      }
    };

    // useEffects are used to react to changes in state of the website
    // The array at the end of function call represents what state changes will trigger this effect
    // In this case, whenever the value of `walletConnected` changes - this effect will be called
    useEffect(() => {
      // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
      if (!walletConnected) {
        // Assign the Web3Modal class to the reference object by setting it's `current` value
        // The `current` value is persisted throughout as long as this page is open
        web3ModalRef.current = new Web3Modal({
          network: "sepolia",
          providerOptions: {},
          disableInjectedProvider: false,
        });
        connectWallet();
        getTotalTokensMinted();
        getBalanceOfMortsTokens();
        getOwner();
      }
    }, [walletConnected]);

    //renderButton: Returns a button based on the state of the dapp
    const renderButton = () => {
      // If we are currently waiting for something, return a loading button
      if (loading) {
        return (
          <div>
            <button className={styles.button}>Loading...</button>
          </div>
        );
      }
      // Show the mint button to mint Mort's Token
      return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

          <button
            className={styles.button}
            disabled={!(tokenAmount > 0)}
            onClick={() => mintMortsToken(tokenAmount)}
          >
            Mint Tokens
          </button>
        </div>
      );
    };

    return (
      <div>
        <Head>
          <title>Mort's Coin</title>
          <meta name="description" content="Mort's Tokens Drop"/>
          <link rel="icon" href="/favicon.ico"/>
        </Head>
        <div className={styles.main}>
          <div>
            <h1 className={styles.title}>Welcome to Mort's ICO!</h1>
            <div className={styles.description}>
               You can mint Mort's Coin here
            </div>
            {walletConnected ? (
              <div>
                <div className={styles.description}>
                  {/* Format Ether helps us in converting a BigNumber to string */}
                  You have minted {utils.formatEther(balanceOfMortsTokens)} Mort's Tokens
                </div>
                <div className={styles.description}>
                  {/* Format Ether helps us in converting a BigNumber to string */}
                  Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
                </div>
                {renderButton()}
                {/* Display additional withdraw button if connected wallet is owner */}
                  {/* {isOwner ? (
                    <div>
                      {loading ? <button className={styles.button}>Loading...</button>
                               : <button className={ styles.button} onClick={withdrawCoins}>
                                    Withdraw Coins
                               </button>
                              
                      }
                    </div>
                  )  : ("")
                } */}
              </div>
            )  : (
                <button onClick={connectWallet} className={styles.button}>
                  Connect your wallet
                </button>
            )}

          </div>
              <div>
                <img/>
              </div>
          </div>
          
          <footer className={styles.footer}>
            Made with &#10084; by Mort's Labs
          </footer>
       </div>
    )
}
