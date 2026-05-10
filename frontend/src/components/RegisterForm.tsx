"use client";

import { useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { REGIONS } from "@/types";
import TxLink from "./TxLink";

export default function RegisterForm() {
  const { identityContract, refreshIdentity } = useWeb3();
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [domisili, setDomisili] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityContract) return;

    // Client-side validation
    if (!nama.trim()) { setError("Nama wajib diisi"); return; }
    if (nik.length !== 16 || !/^\d{16}$/.test(nik)) { setError("NIK harus 16 digit angka"); return; }
    if (!domisili) { setError("Pilih domisili Anda"); return; }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const tx = await identityContract.registerIdentity(nama, BigInt(nik), domisili);
      setTxHash(tx.hash);
      await tx.wait();
      await refreshIdentity();
    } catch (err: unknown) {
      const contractErr = err as { reason?: string; message?: string };
      if (contractErr.reason) {
        setError(contractErr.reason);
      } else if (contractErr.message?.includes("AlreadyRegistered")) {
        setError("Wallet ini sudah terdaftar.");
      } else if (contractErr.message?.includes("NIKAlreadyUsed")) {
        setError("NIK ini sudah digunakan oleh wallet lain.");
      } else if (contractErr.message?.includes("user rejected")) {
        setError("Transaksi dibatalkan oleh pengguna.");
      } else {
        setError("Gagal mendaftarkan identitas. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Registrasi KTP Digital</h2>
          <p className="text-text-secondary mt-2">Daftarkan identitas Anda ke blockchain</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nama Lengkap</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Masukkan nama lengkap"
              className="input-field" disabled={isLoading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">NIK (16 Digit)</label>
            <input type="text" value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="3201234567890001" className="input-field font-mono" disabled={isLoading} maxLength={16} />
            <p className="text-xs text-text-muted mt-1">{nik.length}/16 digit</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Domisili</label>
            <select value={domisili} onChange={(e) => setDomisili(e.target.value)} className="select-field" disabled={isLoading}>
              <option value="">Pilih Provinsi</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-subtle border border-error/20 text-error text-sm">{error}</div>
          )}

          {txHash && (
            <div className="p-3 rounded-xl bg-accent-subtle border border-accent/20">
              <p className="text-sm text-text-secondary mb-1">Transaksi dikirim:</p>
              <TxLink txHash={txHash} label="Lihat di Etherscan" />
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-accent w-full flex items-center justify-center gap-2">
            {isLoading ? (
              <><span className="spinner !w-5 !h-5 !border-2" /> Mengirim Transaksi...</>
            ) : (
              "Daftarkan Identitas"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
