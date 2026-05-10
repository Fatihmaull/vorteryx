"use client";

export default function PendingVerification() {
  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-warning-subtle flex items-center justify-center mx-auto mb-6 animate-float">
          <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3">Menunggu Verifikasi</h2>
        <p className="text-text-secondary mb-6 leading-relaxed">
          Identitas Anda telah terdaftar di blockchain. Admin perlu memverifikasi KTP Anda sebelum Anda dapat memberikan suara.
        </p>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-3">
            <span className="badge badge-pending">
              <span className="pulse-dot bg-warning" /> Pending
            </span>
            <span className="text-sm text-text-secondary">Verifikasi sedang diproses</span>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-6">
          Proses ini membutuhkan admin untuk memverifikasi identitas Anda secara manual.
          Silakan hubungi admin jika membutuhkan bantuan.
        </p>
      </div>
    </div>
  );
}
