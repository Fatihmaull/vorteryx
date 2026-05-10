"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers, BrowserProvider, JsonRpcSigner, Contract } from "ethers";
import { CONTRACT_ADDRESSES, IDENTITY_MANAGER_ABI, VOTING_ENGINE_ABI } from "@/lib/contracts";
import { SEPOLIA_CHAIN_ID, SUPPORTED_CHAIN_IDS } from "@/lib/constants";
import { KTP } from "@/types";

interface Web3State {
  account: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  identityContract: Contract | null;
  votingContract: Contract | null;
  identity: KTP | null;
  isOwner: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const Web3Context = createContext<Web3State>({} as Web3State);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [identityContract, setIdentityContract] = useState<Contract | null>(null);
  const [votingContract, setVotingContract] = useState<Contract | null>(null);
  const [identity, setIdentity] = useState<KTP | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId !== null && SUPPORTED_CHAIN_IDS.includes(chainId);

  const setupContracts = useCallback(async (signer: JsonRpcSigner) => {
    try {
      if (!CONTRACT_ADDRESSES.identityManager || !CONTRACT_ADDRESSES.votingEngine) {
        console.warn("Contract addresses not configured. Set NEXT_PUBLIC_IDENTITY_MANAGER_ADDRESS and NEXT_PUBLIC_VOTING_ENGINE_ADDRESS");
        return;
      }
      const im = new Contract(CONTRACT_ADDRESSES.identityManager, IDENTITY_MANAGER_ABI, signer);
      const ve = new Contract(CONTRACT_ADDRESSES.votingEngine, VOTING_ENGINE_ABI, signer);
      setIdentityContract(im);
      setVotingContract(ve);

      // Check ownership
      const ownerAddr = await im.owner();
      const signerAddr = await signer.getAddress();
      setIsOwner(ownerAddr.toLowerCase() === signerAddr.toLowerCase());
    } catch (err) {
      console.error("Failed to setup contracts:", err);
    }
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (!identityContract || !account) return;
    try {
      const [nama, nik, domisili, isVerified] = await identityContract.getIdentity(account);
      if (nik === 0n) {
        setIdentity(null);
      } else {
        setIdentity({ nama, nik, domisili, isVerified });
      }
    } catch {
      setIdentity(null);
    }
  }, [identityContract, account]);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed. Please install it to continue.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      await setupContracts(signer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [setupContracts]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIdentityContract(null);
    setVotingContract(null);
    setIdentity(null);
    setIsOwner(false);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (err: unknown) {
      const switchErr = err as { code?: number };
      if (switchErr.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: "Sepolia Testnet",
            rpcUrls: ["https://rpc.sepolia.org"],
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      }
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  // Refresh identity when contracts or account changes
  useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity]);

  return (
    <Web3Context.Provider
      value={{
        account, provider, signer, chainId, isConnected, isConnecting,
        isCorrectNetwork, identityContract, votingContract, identity,
        isOwner, error, connectWallet, disconnectWallet, switchNetwork,
        refreshIdentity,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within Web3Provider");
  return context;
}
