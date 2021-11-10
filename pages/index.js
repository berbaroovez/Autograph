import { useEffect, useState, useRef } from "react";
import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { InfuraProvider, Web3Provider } from "@ethersproject/providers";
import useLocalStorage from "../hooks/useLocalStorage";
import { MetamaskIcon, WalletConnectIcon } from "../components/icons";
import Layout from "../components/Layout";
import styled from "styled-components";
import { ethers } from "ethers";

import VisuallyHidden from "@reach/visually-hidden";
import { Dialog, DialogOverlay, DialogContent } from "@reach/dialog";
import "@reach/dialog/styles.css";
import Autograph from "../util/Autograph.json";
import ENS, { getEnsAddress } from "@ensdomains/ensjs";
import PlayerProfile from "../components/UserProfile";
import makeBlockie from "ethereum-blockies-base64";

const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });
const wcConnector = new WalletConnectConnector({
  infuraId: process.env.NEXT_PUBLIC_INFURA_KEY,
});

const ConnectorNames = {
  Injected: "injected",
  WalletConnect: "walletconnect",
};

const W3Operations = {
  Connect: "connect",
  Disconnect: "disconnect",
};

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  // library.pollingInterval = 12000;
  return library;
}

export default function WrapperHome() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Home />
    </Web3ReactProvider>
  );
}

function Home() {
  const web3React = useWeb3React();
  const { active, activate, error } = web3React;
  const [loaded, setLoaded] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [formUrl, setFormUrl] = useState("");
  const [formPrice, setFormPrice] = useState(0);

  const [loading, setLoading] = useState(true);
  const [latestOp, setLatestOp] = useLocalStorage("latest_op", "");
  const [latestConnector, setLatestConnector] = useLocalStorage(
    "latest_connector",
    ""
  );
  const [showDialog, setShowDialog] = useState(false);
  const open = () => setShowDialog(true);
  const close = () => setShowDialog(false);

  const [signerList, setSignerList] = useState([]);
  const [ownerList, setOwnerList] = useState([]);
  const AutographContractAddress = "0xBD22425D9c88F5912eE787d0C6795A910856D241";

  useEffect(() => {
    if (latestOp == "connect" && latestConnector == "injected") {
      injected
        .isAuthorized()
        .then((isAuthorized) => {
          setLoaded(true);
          if (isAuthorized && !web3React.active && !web3React.error) {
            web3React.activate(injected);
          }
        })
        .catch(() => {
          setLoaded(true);
        });
    } else if (latestOp == "connect" && latestConnector == "walletconnect") {
      web3React.activate(wcConnector);
    }
  }, []);

  useEffect(() => {
    const asyncFunction = async () => {
      const provider = new ethers.providers.InfuraProvider(
        "homestead",
        process.env.NEXT_PUBLIC_INFURA_KEY
      );

      const contract = new ethers.Contract(
        AutographContractAddress,
        Autograph.abi,
        provider
      );

      // const ens = new ENS({
      //   provider: process.env.NEXT_PUBLIC_INFURA_KEY,
      //   ensAddress: getEnsAddress("1"),
      // });

      const tempOwnerList = [];
      const numberOfMinted = await contract.lastMintedId();
      for (let i = 1; i <= numberOfMinted; i++) {
        const tempObject = {};
        const bookOwner = await contract.ownerOf(i);
        let signers = await contract.getSigners(bookOwner);

        console.log("Signers", signers);

        const tempSignersArray = [...signers];
        for (var s = 0; s < signers.length; s++) {
          const signerENSName = await provider.lookupAddress(signers[s]);
          console.log(signerENSName);
          console.log(typeof signers[s]);
          // console.log(signers[s]);
          if (signerENSName) {
            tempSignersArray[s] = signerENSName;
          }
        }
        tempObject.avatar = makeBlockie(bookOwner);
        tempObject.signers = tempSignersArray;
        // console.log(ens.name(bookOwner).getAddress());
        console.log(`$autograph book #${i} is owned by ${bookOwner}`);
        tempObject.id = i;
        tempObject.title = bookOwner;
        const ensName = await provider.lookupAddress(bookOwner);

        if (ensName) {
          tempObject.owner = ensName;
        } else {
          tempObject.owner = getTruncatedAddress(bookOwner);
        }

        tempOwnerList.push(tempObject);
      }
      setOwnerList(tempOwnerList);
      setLoading(false);
    };

    asyncFunction();
  }, []);

  const signProfile = async (address) => {
    console.log("Signing profile for", address);
    const signer = web3React.library.getSigner();

    const contract = new ethers.Contract(
      AutographContractAddress,
      Autograph.abi,
      signer
    );

    try {
      const txn = await contract.sign(
        address,

        { gasLimit: 300000 }
      );
    } catch (error) {
      //we need this because the website will error out when we cancel a transaction
    }
  };
  const getTruncatedAddress = (address) => {
    if (address && address.startsWith("0x")) {
      return address.substr(0, 4) + "..." + address.substr(address.length - 4);
    }
    return address;
  };

  // if (loading) {
  //   return <div>Loading</div>;
  // }

  return (
    <>
      <DialogZone isOpen={showDialog} onDismiss={close}>
        <div className="connect-wallet-container">
          <div className="connect-wallet-card">
            <div className="wallet-header">Connect your wallet</div>
            <div
              className="button metamask"
              onClick={() => {
                setLatestConnector(ConnectorNames.Injected);
                setLatestOp(W3Operations.Connect);
                web3React.activate(injected);
                close();
              }}
            >
              Metamask
              <MetamaskIcon />
            </div>
            <div
              className="button walletconnect"
              onClick={() => {
                setLatestConnector(ConnectorNames.WalletConnect);
                setLatestOp(W3Operations.Connect);
                web3React.activate(wcConnector);
                close();
              }}
            >
              WalletConnect
              <WalletConnectIcon />
            </div>
          </div>
        </div>
      </DialogZone>
      <NavZone>
        <div>Eth Profile Sign</div>
        {web3React.active ? (
          <div className="connected">
            <div className="nav-button" title={web3React.account}>
              {getTruncatedAddress(web3React.account)}
            </div>
            <div
              className="disconnect-button"
              title="Disconnect"
              onClick={() => {
                setLatestOp(W3Operations.Disconnect);
                web3React.deactivate();
              }}
            >
              X
            </div>
          </div>
        ) : (
          <div className="nav-button" onClick={open}>
            Connect Wallet
          </div>
        )}
      </NavZone>
      <Layout>
        <div className="container">
          <CardZone>
            {ownerList.length > 0
              ? ownerList.map((profile) => (
                  <PlayerProfile
                    key={profile.id}
                    owner={profile.owner}
                    id={profile.id}
                    signers={profile.signers}
                    avatar={profile.avatar}
                    title={profile.title}
                    signedin={web3React.active}
                    signProfile={signProfile}
                  />
                ))
              : "Grabbing Profiles"}
          </CardZone>

          <FooterZone>
            <a
              href="https://github.com/shivkanthb/web3-starter"
              target="_blank"
              rel="noreferrer"
            >
              web3-starter github
            </a>
            <a
              href="https://twitter.com/berbaroovez"
              target="_blank"
              rel="noreferrer"
            >
              @berbaroovez
            </a>
            <a
              href="https://twitter.com/neuroswish"
              target="_blank"
              rel="noreferrer"
            >
              original contract by @neuroswish
            </a>
          </FooterZone>
        </div>
      </Layout>
    </>
  );
}

const CardZone = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  width: 950px;
  margin: 0 auto;
`;

const NavZone = styled.div`
  font-family: "Roboto", sans-serif;
  display: flex;
  justify-content: space-between;
  margin: 0 20px;
  margin-bottom: 20px;
  background: linear-gradient(
    270deg,
    #8e8cf9 -6.55%,
    rgba(153, 236, 191, 0.765625) 20.05%,
    rgba(223, 167, 167, 0.510417) 49.02%,
    rgba(255, 199, 0, 0.2) 106.96%
  );
  border-radius: 5px;
  align-items: center;
  padding: 5px;

  .nav-button {
    background-color: rgb(64, 64, 180);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
  }
  .nav-button:hover {
    background-color: rgb(80, 80, 179);
  }

  .connected {
    display: flex;
    gap: 5px;
  }

  .disconnect-button {
    background-color: #f96666;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
  }

  .disconnect-button:hover {
    background-color: #ff4343;
  }
`;

const DialogZone = styled(Dialog)`
  font-family: "Roboto", sans-serif;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .connect-wallet-container {
    display: flex;
    width: 400px;
    height: 300px;
    border-radius: 30px;
    background: #ffffff;
    justify-content: center;
    align-items: center;
    text-align: center;
    box-shadow: rgb(0 0 0 / 10%) 0px 4px 20px;
  }
  .wallet-header {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 30px;
  }
  .button {
    width: 300px;
    height: 60px;
    background: #ffffff;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 25px;
    margin: 20px auto;
  }
  .button:hover {
    cursor: pointer;
  }
`;

const FooterZone = styled.div`
  padding-top: 20px;
  font-family: "Roboto", sans-serif;

  justify-content: center;
  display: flex;

  gap: 40px;
  bottom: 30px;
  a {
    color: rgb(80, 80, 179);
  }
`;
