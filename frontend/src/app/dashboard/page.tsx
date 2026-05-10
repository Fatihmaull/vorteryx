"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import WalletConnect from "@/components/WalletConnect";

interface Candidate {
  id: number;
  name: string;
  region: string;
}

interface Election {
  id: number;
  title: string;
  region: string;
  status: number;
  candidates: Candidate[];
}

export default function DashboardPage() {
  const { account, isConnected, identity, votingContract } = useWeb3();
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVotedMap, setHasVotedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isConnected && votingContract && identity?.isVerified) {
      fetchElections();
    }
  }, [isConnected, votingContract, identity]);

  const fetchElections = async () => {
    if (!votingContract || !identity) return;
    try {
      const electionsData = await votingContract.getAllElections();
      const loadedElections: Election[] = [];
      const votedMap: Record<number, boolean> = {};

      for (const e of electionsData) {
        const status = Number(e.status);
        // Only fetch active elections matching user region
        if (status === 1 && e.region === identity.domisili) {
          const id = Number(e.id);
          const hasVoted = await votingContract.hasVoted(id, account);
          votedMap[id] = hasVoted;

          const candIds = e.candidateIds || [];
          const candidates: Candidate[] = [];
          for (const cId of candIds) {
             const c = await votingContract.getCandidate(cId);
             candidates.push({ id: Number(c.id), name: c.name, region: c.region });
          }

          loadedElections.push({
            id,
            title: e.title,
            region: e.region,
            status,
            candidates
          });
        }
      }
      setActiveElections(loadedElections);
      setHasVotedMap(votedMap);
    } catch (err) {
      console.error("Failed to fetch elections", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
        <p className="text-zinc-600 mb-8">Silakan hubungkan dompet MetaMask Anda terlebih dahulu.</p>
        <WalletConnect />
      </div>
    );
  }

  if (!identity || !identity.isVerified) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full text-center py-20">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Verifikasi KTP Diperlukan</h2>
        <p className="text-zinc-600 mb-8 max-w-md">
          Anda harus memiliki identitas KTP yang terverifikasi untuk dapat mengikuti pemilihan.
        </p>
      </div>
    );
  }

  const handleVote = async (electionId: number) => {
    if (selectedCandidate === null || !votingContract) return;
    setIsVoting(true);
    try {
      const tx = await votingContract.vote(electionId, selectedCandidate);
      await tx.wait();
      await fetchElections(); // Refresh to show "Terima Kasih"
    } catch (err) {
      console.error(err);
      alert("Gagal memberikan suara.");
    } finally {
      setIsVoting(false);
      setSelectedCandidate(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Bilik Suara (Voting)</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Silakan gunakan hak pilih Anda dengan bijak. 1 Warga, 1 Suara. Domisili Anda: <strong>{identity.domisili}</strong>
        </p>
      </div>

      {activeElections.length === 0 ? (
        <div className="p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-center">
          <h2 className="text-xl font-bold mb-2">Tidak ada pemilihan aktif</h2>
          <p className="text-zinc-500">Saat ini tidak ada pemilihan yang sedang berlangsung di wilayah Anda ({identity.domisili}).</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeElections.map(election => {
            const hasVoted = hasVotedMap[election.id];
            
            if (hasVoted) {
              return (
                <div key={election.id} className="p-12 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl text-center animate-fade-in">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-4">Terima Kasih!</h2>
                  <p className="text-green-600 dark:text-green-300 text-lg">
                    Suara Anda untuk <strong>{election.title}</strong> telah berhasil dicatat ke dalam Blockchain.
                  </p>
                </div>
              );
            }

            return (
              <div key={election.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                    Active
                  </div>
                  <h2 className="text-2xl font-bold">{election.title}</h2>
                  <p className="text-zinc-500 mt-1">Wilayah: {election.region}</p>
                </div>

                <div className="grid gap-4 mb-8">
                  {election.candidates.map((candidate) => (
                    <label
                      key={candidate.id}
                      className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedCandidate === candidate.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCandidate === candidate.id ? "border-blue-500" : "border-zinc-400"
                        }`}>
                          {selectedCandidate === candidate.id && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{candidate.name}</h3>
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-black text-zinc-400">
                        0{candidate.id}
                      </div>
                    </label>
                  ))}
                  {election.candidates.length === 0 && (
                    <div className="text-center py-6 text-zinc-500">Belum ada kandidat di pemilihan ini.</div>
                  )}
                </div>

                <button
                  onClick={() => handleVote(election.id)}
                  disabled={selectedCandidate === null || isVoting}
                  className="w-full py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold rounded-2xl text-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center gap-2"
                >
                  {isVoting ? "Mencatat ke Blockchain..." : "Berikan Suara"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
