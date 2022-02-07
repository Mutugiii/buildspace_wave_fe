import React, { useEffect, useState } from "react";
import Loader from "react-loader-spinner";
import './App.css';

import { ethers } from "ethers";
import abi from "./utils/WavePortal.json"

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveCount, setWaveCount] = useState(0);
  const [waveMessage, setWaveMessage] = useState("");
  const [mining, setMining] = useState(false);

  const contractAddress = "0xfAa4660e2b62f09a74a1f6746803E06c07625Ad3";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      // Check if metamask is installed
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Ensure you have metamask installed!")
      } else {
        // console.log("We have the ethereum object", ethereum);
      }

      // Check if we are authorised to access the users account
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account ", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found!");
      }
    } catch (error) {
      console.log(error);
    }
  }


  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Kindly install Metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }


  const wave = async (e) => {
    e.preventDefault();

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        setMining(true);

        await waveTxn.wait();
        console.log("Mined...", waveTxn.hash);

        setMining(false);
        setWaveMessage("")
      } else {
        console.log("Ethereum object does not exist")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const fetchWaveCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setWaveCount(count.toNumber());
        console.log("Retrieved total wave count: ", count.toNumber());
      } else {
        console.log("Ethereum Object Not found!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const webPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await webPortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: wave.timestamp,
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object does not exist")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        },
      ]);
      setWaveCount(prevState => prevState + 1);
    };

    if(window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();


      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if(wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);


  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
  }, [])
  useEffect(() => fetchWaveCount(), [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am Mutugi and I am a software Engineer! Connect your Ethereum wallet and wave at me!
        </div>

        <div className="waveCount" style={styles.countBlock}>
          <span><i>Waves:</i></span> <br></br>
          <span style={styles.countFigure}>{waveCount}</span>
        </div>

        {mining ? (
          <Loader className="bio" style={styles.loaderStyles} type="Circles" color="#00BFFF" height={40} width={40} />
        ) : (
          <div style={styles.messageBlock}>
            <form>
              <div>
                <label htmlFor="wavemsg-type">
                  Wave Message
                </label>
              </div>
              <textarea
                id="wavemsg-type"
                style={styles.textAreaStyles}
                rows="5"
                value={waveMessage}
                onChange={(e) => { setWaveMessage(e.target.value) }}
              />
              <br></br>
              <button type="submit" className="waveButton" style={styles.buttonSpace} onClick={wave}>
                Wave at Me
              </button>
            </form>
          </div>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}

      </div>
    </div>
  );
}

const styles = {
  loaderStyles: {
    textAlign: "center",
    marginTop: "30px",
    marginBottom: "30px",
  },
  buttonSpace: {
    marginBottom: "30px",
  },
  countBlock: {
    marginTop: "30px",
    textAlign: "center",
  },
  countFigure: {
    fontSize: "30px",
    fontWeight: "bolder",
    color: "#1c2333",
  },
  messageBlock: {    
    textAlign: "center",
    marginTop: "30px"
  },
  textAreaStyles: {
    borderRadius: "0.5em",
  },
}
