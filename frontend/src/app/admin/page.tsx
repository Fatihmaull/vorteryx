"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import WalletConnect from "@/components/WalletConnect";
import { REGIONS } from "@/types";

interface PendingUser {
  address: string;
  nama: string;
  nik: string;
  domisili: string;
}

interface Election {
  id: number;
  title: string;
  region: string;
  status: number;
}

export default function AdminPage() {
  const { isConnected, isOwner, identityContract, votingContract } = useWeb3();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  
  // State for forms
  const [newElectionTitle, setNewElectionTitle] = useState("");
  const [newElectionRegion, setNewElectionRegion] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateRegion, setNewCandidateRegion] = useState("");
  const [isCreatingElection, setIsCreatingElection] = useState(false);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  useEffect(() => {
    if (isOwner && identityContract && votingContract) {
      fetchData();
    }
  }, [isOwner, identityContract, votingContract]);

  const fetchData = async () => {
    if (!identityContract || !votingContract) return;

    try {
      // Fetch users
      const usersAddr: string[] = await identityContract.getRegisteredUsers(0, 100);
      const pending: PendingUser[] = [];
      for (const addr of usersAddr) {
        const [nama, nik, domisili, isVerified] = await identityContract.getIdentity(addr);
        if (!isVerified) {
          pending.push({ address: addr, nama, nik: nik.toString(), domisili });
        }
      }
      setPendingUsers(pending);

      // Fetch elections
      const allElections = await votingContract.getAllElections();
      setElections(allElections.map((e: any) => ({
        id: Number(e.id),
        title: e.title,
        region: e.region,
        status: Number(e.status)
      })));
    } catch (err) {
      console.error("Failed to fetch admin data", err);
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

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full text-center py-20">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Halaman Khusus Admin</h2>
        <p className="text-zinc-600 mb-8 max-w-md">
          Alamat dompet Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini hanya untuk pemilik (owner) Smart Contract.
        </p>
      </div>
    );
  }

  const handleVerify = async (address: string) => {
    if (!identityContract) return;
    setIsVerifying(address);
    try {
      const tx = await identityContract.verifyUser(address);
      await tx.wait();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to verify user.");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleCreateElection = async () => {
    if (!votingContract) return;
    if (!newElectionTitle || !newElectionRegion) {
      alert("Title and Region required");
      return;
    }
    setIsCreatingElection(true);
    try {
      // For simplicity in this demo, creating an election with empty candidates list
      // Real flow might require adding candidates first then creating election with their IDs
      const tx = await votingContract.createElection(newElectionTitle, newElectionRegion, []);
      await tx.wait();
      setNewElectionTitle("");
      setNewElectionRegion("");
      await fetchData();
      alert("Election Created! Make sure to add candidates.");
    } catch (err) {
      console.error(err);
      alert("Failed to create election.");
    } finally {
      setIsCreatingElection(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!votingContract) return;
    if (!newCandidateName || !newCandidateRegion) {
      alert("Name and Region required");
      return;
    }
    setIsAddingCandidate(true);
    try {
      const tx = await votingContract.addCandidate(newCandidateName, newCandidateRegion);
      await tx.wait();
      setNewCandidateName("");
      setNewCandidateRegion("");
      alert("Candidate Added! They can now be included in elections.");
    } catch (err) {
      console.error(err);
      alert("Failed to add candidate.");
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const handleEndElection = async (id: number) => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.endElection(id);
      await tx.wait();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to end election.");
    }
  };
  
  const handleStartElection = async (id: number) => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.startElection(id);
      await tx.wait();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to start election.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Kelola verifikasi KTP warga dan konfigurasi pemilihan.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                {pendingUsers.length}
              </span>
              Antrean Verifikasi KTP
            </h2>

            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                Semua pendaftar sudah diverifikasi! 🎉
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.address} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="font-bold text-lg">{user.nama}</h3>
                      <div className="text-sm text-zinc-500 font-mono mt-1 mb-1">NIK: {user.nik}</div>
                      <div className="inline-block px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs rounded-md">
                        Domisili: {user.domisili}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-2 truncate w-48">
                        {user.address}
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerify(user.address)}
                      disabled={isVerifying !== null}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isVerifying === user.address ? "Memproses..." : "Verify"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Manajemen Pemilihan</h2>
            
            <div className="space-y-4 mb-8">
              <input 
                type="text" 
                placeholder="Title (e.g. Pilgub Jabar 2025)" 
                className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                value={newElectionTitle}
                onChange={e => setNewElectionTitle(e.target.value)}
              />
              <select 
                className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                value={newElectionRegion}
                onChange={e => setNewElectionRegion(e.target.value)}
              >
                <option value="">Pilih Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button 
                onClick={handleCreateElection}
                disabled={isCreatingElection}
                className="w-full py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                {isCreatingElection ? "Memproses..." : "+ Buat Pemilihan Baru"}
              </button>
            </div>

            <div className="space-y-4 mb-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <input 
                type="text" 
                placeholder="Candidate Name" 
                className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                value={newCandidateName}
                onChange={e => setNewCandidateName(e.target.value)}
              />
              <select 
                className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                value={newCandidateRegion}
                onChange={e => setNewCandidateRegion(e.target.value)}
              >
                <option value="">Pilih Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button 
                onClick={handleAddCandidate}
                disabled={isAddingCandidate}
                className="w-full py-3 bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                {isAddingCandidate ? "Memproses..." : "+ Tambah Kandidat"}
              </button>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold mb-4 text-zinc-500 uppercase text-xs tracking-wider">Pemilihan</h3>
              <div className="space-y-4">
                {elections.map(e => (
                  <div key={e.id} className={`p-4 border rounded-2xl ${e.status === 1 ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="font-bold mb-1">{e.title}</div>
                    <div className="text-xs mb-4">Region: {e.region} | Status: {e.status === 0 ? "Pending" : e.status === 1 ? "Active" : "Ended"}</div>
                    {e.status === 0 && (
                       <button onClick={() => handleStartElection(e.id)} className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg text-sm transition-colors mb-2">
                         Mulai Pemilihan
                       </button>
                    )}
                    {e.status === 1 && (
                      <button onClick={() => handleEndElection(e.id)} className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-semibold rounded-lg text-sm transition-colors">
                        Tutup Pemilihan
                      </button>
                    )}
                  </div>
                ))}
                {elections.length === 0 && (
                  <div className="text-sm text-zinc-500 text-center py-4">Belum ada pemilihan.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
