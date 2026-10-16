import React, { useEffect } from 'react';
import NmNav from '../components/NmNav';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const VAULT_SRC = `${BACKEND}/api/bifrost/v1/vault/?do=vault`;

export default function VaultPage() {
  useEffect(() => { document.title = 'Vault · Vaulz zk'; }, []);
  return (
    <div className="vz relative min-h-screen bg-[#090d10]" data-testid="vault-page">
      <div className="vz-world left" aria-hidden="true" />
      <NmNav active="vault" />
      <main className="relative z-[1] pt-[96px]">
        <section className="mx-auto w-[91.6%] pb-4">
          <a href="/" className="vz-link inline-flex items-center gap-2 text-[11px]" data-testid="vault-all-tools">&larr; All tools</a>
          <p className="vz-eyebrow mt-6">Your private toolkit / 14</p>
          <h1 className="mt-4 text-[56px] font-normal leading-[.96] tracking-[-.072em] text-[var(--vz-strong)] sm:text-[80px]">Vault<span className="text-[var(--vz-muted)]">.</span></h1>
          <p className="vz-serif mt-4 max-w-2xl text-[22px] leading-[1.25] text-[var(--vz-dim)]">
            Your SOL, out of reach of quantum computers.
          </p>
          <p className="mt-3 max-w-2xl text-[13px] leading-[1.65] text-[var(--vz-muted)]">
            The vault pays out only against a hash-based signature from keys your passkey or 24 words create.
            Open it with Face ID or make a new vault below.
          </p>
        </section>
        <div className="mx-auto w-[91.6%] pb-10">
          <iframe
            src={VAULT_SRC}
            title="Vaulz zk Vault"
            data-testid="vault-frame"
            allow="publickey-credentials-create *; publickey-credentials-get *; clipboard-write; clipboard-read"
            className="vz-glass block h-[calc(100vh-150px)] min-h-[620px] w-full"
          />
        </div>
      </main>
    </div>
  );
}
