"use client";

import { useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import WalletConnect from "@/components/WalletConnect";

// --- MOCK DATA ---
const MOCK_PENDING_USERS = [
  { address: "0x1234...abcd", nama: "Joko Anwar", nik: "3201012345678901", domisili: "Jakarta" },
  { address: "0x5678...efgh", nama: "Rini Susanti", nik: "3201098765432109", domisili: "Jawa Barat" },
];

export default function AdminPage() {
  const { isConnected, isOwner } = useWeb3();
  const [pendingUsers, setPendingUsers] = useState(MOCK_PENDING_USERS);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  // Jika belum connect wallet
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
        <p className="text-zinc-600 mb-8">Silakan hubungkan dompet MetaMask Anda terlebih dahulu.</p>
        <WalletConnect />
      </div>
    );
  }

  // Jika bukan owner
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

  const handleVerify = (address: string) => {
    setIsVerifying(address);
    // Simulasi loading
    setTimeout(() => {
      setPendingUsers(pendingUsers.filter(u => u.address !== address));
      setIsVerifying(null);
    }, 1500);
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
        {/* Kolom Kiri: Verifikasi KTP */}
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

        {/* Kolom Kanan: Manajemen Pemilihan */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Manajemen Pemilihan</h2>
            
            <button className="w-full py-3 mb-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
              + Buat Pemilihan Baru
            </button>
            <button className="w-full py-3 mb-8 bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700">
              + Tambah Kandidat
            </button>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold mb-4 text-zinc-500 uppercase text-xs tracking-wider">Pemilihan Aktif</h3>
              <div className="p-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                <div className="font-bold mb-1">Pilgub Jakarta 2025</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-4">Status: Active</div>
                <button className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-semibold rounded-lg text-sm transition-colors">
                  Tutup Pemilihan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
