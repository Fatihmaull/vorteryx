// ═══════════════════════════════════════════════════════════════════════
// VoteryX — Contract Constants & Configuration
// ═══════════════════════════════════════════════════════════════════════

export const SEPOLIA_CHAIN_ID = 11155111;
export const HARDHAT_CHAIN_ID = 31337;

export const EXPLORER_URL = "https://sepolia.etherscan.io";

export const SUPPORTED_CHAIN_IDS = [SEPOLIA_CHAIN_ID, HARDHAT_CHAIN_ID];

export function getExplorerTxUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatChainName(chainId: number): string {
  switch (chainId) {
    case SEPOLIA_CHAIN_ID:
      return "Sepolia Testnet";
    case HARDHAT_CHAIN_ID:
      return "Hardhat Local";
    default:
      return "Unknown Network";
  }
}
