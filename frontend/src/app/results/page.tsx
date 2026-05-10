"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";

interface CandidateResult {
  id: number;
  name: string;
  region: string;
  voteCount: number;
  percentage: number;
}

interface ElectionResult {
  id: number;
  title: string;
  region: string;
  status: number;
  totalVotes: number;
  candidates: CandidateResult[];
}

export default function ResultsPage() {
  const { votingContract, provider } = useWeb3();
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (votingContract) {
      fetchResults();
    } else {
      setIsLoading(false); // If no web3, just show nothing or loading
    }
  }, [votingContract]);

  const fetchResults = async () => {
    if (!votingContract) return;
    try {
      const electionsData = await votingContract.getAllElections();
      const loadedResults: ElectionResult[] = [];

      for (const e of electionsData) {
        const id = Number(e.id);
        const totalVotes = Number(e.totalVotes);
        
        const candIds = e.candidateIds || [];
        const candidates: CandidateResult[] = [];
        for (const cId of candIds) {
           const c = await votingContract.getCandidate(cId);
           const voteCount = Number(c.voteCount);
           const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
           
           candidates.push({ 
             id: Number(c.id), 
             name: c.name, 
             region: c.region,
             voteCount,
             percentage: parseFloat(percentage.toFixed(1))
           });
        }

        // Sort candidates by voteCount descending
        candidates.sort((a, b) => b.voteCount - a.voteCount);

        loadedResults.push({
          id,
          title: e.title,
          region: e.region,
          status: Number(e.status),
          totalVotes,
          candidates
        });
      }
      setResults(loadedResults);
    } catch (err) {
      console.error("Failed to fetch results", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 text-center text-zinc-500">
        Memuat data dari Blockchain Sepolia...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Hasil Pemilihan Langsung</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Transparan, aman, dan tidak dapat dimanipulasi (Immutable) berkat teknologi Blockchain.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-zinc-500">
          Belum ada data pemilihan yang tercatat.
        </div>
      ) : (
        <div className="space-y-8">
          {results.map((election) => (
            <div key={election.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8 gap-4">
                <div>
                  <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 uppercase tracking-wider ${
                    election.status === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    election.status === 2 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {election.status === 0 ? "Pending" : election.status === 1 ? "Live Update" : "Ended"}
                  </div>
                  <h2 className="text-2xl font-bold">{election.title}</h2>
                  <p className="text-zinc-500 mt-1">Wilayah: {election.region}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-1">Total Suara Masuk</p>
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{election.totalVotes.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-6">
                {election.candidates.map((candidate) => (
                  <div key={candidate.id} className="relative pt-2">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{candidate.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xl">{candidate.percentage}%</span>
                        <p className="text-sm text-zinc-500">{candidate.voteCount.toLocaleString()} Suara</p>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${candidate.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {election.candidates.length === 0 && (
                  <div className="text-center py-6 text-zinc-500">Belum ada kandidat di pemilihan ini.</div>
                )}
              </div>
              
              <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-start gap-4">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  Data ini diambil langsung dari Smart Contract VotingEngine di jaringan Ethereum Sepolia. 
                  Semua perhitungan suara bersifat otomatis dan transparan. Tidak ada pihak yang dapat mengubah hasil ini.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
