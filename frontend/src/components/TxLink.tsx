"use client";

import { getExplorerTxUrl } from "@/lib/constants";

interface TxLinkProps {
  txHash: string;
  label?: string;
}

export default function TxLink({ txHash, label }: TxLinkProps) {
  return (
    <a
      href={getExplorerTxUrl(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors text-sm font-medium"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      {label || `${txHash.slice(0, 10)}...${txHash.slice(-6)}`}
    </a>
  );
}
