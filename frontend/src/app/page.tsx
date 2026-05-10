"use client";

import { useWeb3 } from "@/contexts/Web3Context";
import RegisterForm from "@/components/RegisterForm";
import PendingVerification from "@/components/PendingVerification";
import WalletConnect from "@/components/WalletConnect";

export default function Home() {
  const { isConnected, isCorrectNetwork, identity, connectWallet, isConnecting } = useWeb3();

  return (
    <div className="flex flex-col flex-1 items-center justify-center w-full max-w-3xl mx-auto">
      {!isConnected ? (
        <div className="text-center flex flex-col items-center gap-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to <span className="text-blue-600 dark:text-blue-400">VoteryX</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Secure, transparent, credential-based decentralized voting on Ethereum.
          </p>
          <div className="mt-4">
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-8 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask to Start"}
            </button>
          </div>
        </div>
      ) : !isCorrectNetwork ? (
        <WalletConnect />
      ) : !identity ? (
        <div className="w-full">
          <RegisterForm />
        </div>
      ) : !identity.isVerified ? (
        <div className="w-full">
          <PendingVerification />
        </div>
      ) : (
        <div className="w-full text-center p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">You are Verified!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8">
            Your on-chain identity ({identity.nama}) is verified for region <strong>{identity.domisili}</strong>.
          </p>
          <p className="text-zinc-500">
            The active elections will appear here soon. Stay tuned!
          </p>
        </div>
      )}
    </div>
  );
}
