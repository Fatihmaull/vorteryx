"use client";

// --- MOCK DATA ---
const MOCK_RESULTS = {
  title: "Pemilihan Gubernur Jakarta 2025",
  region: "Jakarta",
  totalVotes: 15420,
  lastUpdated: "Baru saja",
  candidates: [
    { id: 1, name: "Budi Santoso", party: "Partai A", voteCount: 6540, percentage: 42.4 },
    { id: 2, name: "Siti Aminah", party: "Partai B", voteCount: 5200, percentage: 33.7 },
    { id: 3, name: "Andi Wijaya", party: "Partai C", voteCount: 3680, percentage: 23.9 },
  ]
};

export default function ResultsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Hasil Pemilihan Langsung</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Transparan, aman, dan tidak dapat dimanipulasi (Immutable) berkat teknologi Blockchain.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8 gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
              Live Update
            </div>
            <h2 className="text-2xl font-bold">{MOCK_RESULTS.title}</h2>
            <p className="text-zinc-500 mt-1">Wilayah: {MOCK_RESULTS.region}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-1">Total Suara Masuk</p>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{MOCK_RESULTS.totalVotes.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-6">
          {MOCK_RESULTS.candidates.map((candidate) => (
            <div key={candidate.id} className="relative pt-2">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="font-bold text-lg">{candidate.name}</h3>
                  <span className="text-sm text-zinc-500">{candidate.party}</span>
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
    </div>
  );
}
