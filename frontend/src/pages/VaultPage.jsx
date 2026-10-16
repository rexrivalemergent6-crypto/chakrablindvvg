import React, { useEffect } from 'react';
import NmNav from '../components/NmNav';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const VAULT_SRC = `${BACKEND}/api/bifrost/v1/vault/?do=vault`;

export default function VaultPage() {
  useEffect(() => { document.title = 'NullCash Vault · quantum-safe SOL'; }, []);
  return (
    <div className="min-h-screen bg-[#f4f6ee]" data-testid="vault-page">
      <NmNav />
      <main className="pt-[84px]">
        <section className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#202221]/55">Quantum-safe · on-chain</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-tight text-[#202221] sm:text-[40px]">NullCash Vault</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#202221]/70">
            Keep SOL where a quantum computer cannot reach it. The vault pays out only against a hash-based
            signature from keys your passkey or 24 words create. Open it with Face ID or make a new vault below.
          </p>
        </section>
        <iframe
          src={VAULT_SRC}
          title="NullCash Vault"
          data-testid="vault-frame"
          allow="publickey-credentials-create *; publickey-credentials-get *; clipboard-write; clipboard-read"
          className="mt-2 block h-[calc(100vh-150px)] min-h-[620px] w-full border-0"
        />
      </main>
    </div>
  );
}
