"use client";

import { useWeb3 } from "@/contexts/Web3Context";
import { shortenAddress, formatChainName } from "@/lib/constants";

export default function WalletConnect() {
  const { account, chainId, isConnected, isConnecting, isCorrectNetwork, connectWallet, disconnectWallet, switchNetwork } = useWeb3();

  if (!isConnected) {
    return (
      <button onClick={connectWallet} disabled={isConnecting} className="btn-accent flex items-center gap-2">
        {isConnecting ? (
          <><span className="spinner !w-4 !h-4 !border-2" /> Connecting...</>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <button onClick={switchNetwork} className="btn-accent !bg-gradient-to-r !from-amber-600 !to-amber-500 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Switch to Sepolia
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-elevated border border-border">
        <span className="pulse-dot bg-success" />
        <span className="text-xs text-text-secondary">{chainId ? formatChainName(chainId) : ""}</span>
      </div>
      <button onClick={disconnectWallet} className="btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full bg-accent" />
        {account ? shortenAddress(account) : ""}
      </button>
    </div>
  );
}
