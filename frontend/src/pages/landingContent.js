// Technical content for the Cadabra launch page.
// Sourced from the upstream protocol documentation (ZK shielded pool, multi-hop private routing,
// intent-based confidential swaps, Solana pool-mixing design). Keep wording factual.

export const PILLARS = [
  {
    key: 'shield',
    tag: 'ZK Shield',
    title: 'A private balance on Solana',
    body:
      'Shield any SPL or Token-2022 token into sealed notes. Send, trade and lend from inside the pool with Groth16 proofs built in your browser. The chain checks the maths without learning who, how much or, when fees are paid in SOL, which token.',
    points: ['Groth16 over BN254', 'Poseidon Merkle tree, 2^26 leaves', 'Keys never leave your browser'],
    href: '/app#shield',
    cta: 'Open ZK Shield',
  },
  {
    key: 'houdini',
    tag: 'Private route',
    title: 'Multi-hop cross-chain private swaps',
    body:
      'Swap from Solana into 120+ chains through multi-hop partner routing. You get live quotes from several routes, then send one manual deposit. No wallet connection and no account needed.',
    points: ['Several live routes per quote', 'Manual deposit, no signatures', 'Track every order live'],
    href: '/app#private-route',
    cta: 'Open Private route',
  },
  {
    key: 'near',
    tag: 'Privacy swap',
    title: 'intent-based confidential swaps',
    body:
      'Exact-input swaps from Solana to Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, NEAR, Solana and native Zcash. Solvers compete to fill your intent, and execution runs in a private shard with restricted visibility.',
    points: ['Intent API · confidential execution', 'Solver network settles cross-chain', 'Solana refund address on every order'],
    href: '/app#privacy-swap',
    cta: 'Open Privacy swap',
  },
];

export const FLOW = [
  { k: 'Your wallet', s: 'Public', d: 'Any Solana wallet stays your public entry and exit. Nothing else about you is needed.' },
  { k: 'Shield', s: 'Enter', d: 'One wallet signature moves tokens behind the privacy wall. The note is sealed in your browser.' },
  { k: 'Private balance', s: 'Sealed', d: 'Your balance is the set of notes only your viewing key can open and only your spending key can spend.' },
  { k: 'Send · Trade · Earn', s: 'Sealed', d: 'Every action spends notes and creates new ones, each with a zero-knowledge proof. A relayer pays the network fee.' },
  { k: 'Withdraw / Swap out', s: 'Exit', d: 'Exit to a fresh one-time address, or swap cross-chain with multi-hop routes and intent-based confidential swaps.' },
];

export const DOC_TABS = [
  {
    key: 'zk',
    label: 'ZK Shield protocol',
    intro:
      'A non-custodial shielded pool on Solana. It uses a UTXO model adapted for zero-knowledge: value lives as notes, the pool stores only commitments, and spending reveals an unlinkable nullifier.',
    blocks: [
      {
        h: 'Notes, commitments and nullifiers',
        p: [
          'Each note commits to a token (mint), an amount, its owner and a random blinding factor. Its public fingerprint, the commitment, is appended as a leaf to an on-chain Poseidon Merkle tree with 26 levels (67,108,864 leaves).',
          'Spending a note publishes its nullifier, which the program records in a spent registry so the note can never be spent twice. The nullifier cannot be linked to the commitment it spends.',
          'Recipients find payments by trial-decrypting every new note ciphertext with their viewing key, so not even the indexer learns which notes belong to whom.',
        ],
      },
      {
        h: 'The circuit',
        p: [
          'Transaction(26, 4, 3): up to 4 notes in and 3 notes out per proof. It is a Groth16 SNARK over BN254 with 13 public inputs, verified on-chain with Solana’s alt_bn128 syscalls.',
          'The constraints enforce Merkle membership of every spent note, correct nullifier derivation, ownership through the spending key, and amount conservation: inputs + public amount = outputs + fees.',
          'Proving and verifying keys come from a Powers-of-Tau trusted setup. The verifying key is hard-coded in the program, so verification is fully deterministic.',
        ],
        code: `circuit  Transaction(levels = 26, nIns = 4, nOuts = 3)
curve    BN254 · Groth16 · 13 public inputs
hash     Poseidon (Merkle tree + commitments)
verify   alt_bn128 syscalls on Solana
assets   /circuits/transaction.wasm · transaction.zkey`,
      },
      {
        h: 'Relayers are bound by the proof',
        p: [
          'A relayer submits your proof and pays the network fee, so your wallet never signs private actions. The recipient, the fee and any swap terms are hashed into the proof by the program itself. A relayer that changes anything ends up with an invalid proof.',
          'Trades run in two steps (swap_prepare then swap_execute). Your proof locks the input in its own escrow, then the route runs. The program checks that the escrow paid out exactly the input and that the vault received at least your minimum, otherwise it refunds automatically.',
        ],
      },
      {
        h: 'Keys and recovery',
        p: [
          'Your vault is one random 32-byte root. From it, your browser derives a spending key, a viewing key and every one-time address. It is encrypted with your passphrase (PBKDF2, 600,000 rounds, then AES-GCM) and stored only in this browser.',
          'The recovery key, shown once, restores everything on any device. It is not derived from your wallet, so a wallet compromise never exposes your private balance, and vice versa.',
        ],
      },
    ],
    table: {
      cols: ['Instruction', 'Purpose'],
      rows: [
        ['transact', 'Shield, private transfer or withdrawal with a Groth16 proof (≤4 in, ≤3 out)'],
        ['swap_prepare · swap_execute · swap_refund', 'Two-step private trade or lending position through an allowlisted program'],
        ['register_asset', 'Open a vault for a token (anyone; screened on-chain)'],
        ['collect_fees', 'Sweep protocol fees to the treasury'],
        ['set_* · accept_admin', '2-of-2 multisig governance: fees, caps, pause, allowlist. It can pause but never move funds'],
      ],
    },
  },
  {
    key: 'houdini',
    label: 'Private route',
    intro:
      'The Private route uses a partner routing network for discovery, quotes, orders and status. It is a manual-deposit flow: you review a live quote, create an order, and choose whether to fund it from your own Solana wallet.',
    blocks: [
      {
        h: 'Order lifecycle',
        p: [
          '1 · Choose a Solana source token and any destination token across 120+ chains, then enter an amount.',
          '2 · Several routes are quoted live. Each shows output, expected time, rate and limits, and refreshes before it expires.',
          '3 · Create the order to reveal the deposit instructions. Creating an order never moves funds.',
          '4 · Send exactly the instructed amount on Solana to the order’s deposit address, with its memo if one is shown, before the deadline.',
          '5 · Track it live: waiting for deposit → confirming → exchanging → sending → completed.',
        ],
      },
      {
        h: 'Quotes and limits',
        p: [
          'Every order needs at least $3 USD of the asset you send. That is a minimum swap value, not a fee. Provider charges, price impact and network costs are already inside the quoted output.',
          'Catalogs and liquidity change. Only a live quote and the order instructions it produces describe what a specific transfer will do.',
        ],
        code: `GET  /api/ds/tokens?side=source|destination&term=&chain=
GET  /api/ds/quotes?from=&to=&amount=
POST /api/ds/orders        { from, to, amount, address, ... }
GET  /api/ds/orders/{id}   → status, deposit, payout`,
      },
    ],
  },
  {
    key: 'near',
    label: 'Privacy swap',
    intro:
      'Privacy swap asks the intent network for basic confidentiality on both the dry preview and the deposit order. An intent says what you want; solvers compete to deliver it, and the verifier contract settles atomically across chains.',
    blocks: [
      {
        h: 'Intents, solvers and settlement',
        p: [
          'You state an exact-input intent: a Solana origin asset, a destination asset and chain, a recipient and a Solana refund address. Market makers (solvers) quote to fill it, and the best one is returned as a dry quote.',
          'After you confirm, the intent network returns deposit instructions. Your manual Solana deposit is detected, the solver delivers on the destination chain, and the verifier contract settles. If execution fails, funds go back to your refund address.',
        ],
        code: `POST /v0/quote  {
  "swapType": "EXACT_INPUT",
  "depositType": "ORIGIN_CHAIN",
  "originAsset": "nep141:sol.omft.near",
  "destinationAsset": "nep141:eth.omft.near",
  "recipient": "0x…", "refundTo": "So1…",
  "confidentiality": "basic"
}`,
      },
      {
        h: 'Confidential processing',
        p: [
          'Execution runs in a private shard with independent, permissioned validators. Encryption and restricted visibility protect the swap details while they are processed. This is confidential execution, not a zero-knowledge shielded pool, and the validators are part of the trust boundary.',
          'Destinations: Solana, NEAR, Ethereum, Arbitrum, Base, Optimism, Polygon and BNB Chain, plus native Zcash as receive-only to a shielded-only Unified Address. Every pair still needs a live quote.',
        ],
      },
      {
        h: 'Fees',
        p: [
          'A 0.40% partner fee is charged from the asset you send and is already reflected in the quoted output, on top of the protocol’s own small fees. Network costs apply on each chain.',
        ],
      },
    ],
  },
  {
    key: 'api',
    label: 'Relayer & indexer API',
    intro:
      'Everything the app does is plain HTTP and JSON-RPC, routed through the Bifrost v1 gateway. Proofs are built on your device, and nothing secret is ever sent.',
    blocks: [],
    table: {
      cols: ['Endpoint', 'What it does'],
      rows: [
        ['GET /v1/info', 'Relayer key, allowlisted swap and lending programs, protocol fee rates'],
        ['GET /v1/fee?mint&inputs', 'Relayer fee for a token and number of notes spent'],
        ['POST /v1/relay', 'Submit a proof (transfer, withdrawal, trade, lend); the relayer pays the network fee'],
        ['POST /v1/sponsor', 'Gasless shield: co-sign a deposit as fee payer after a strict check'],
        ['GET /v1/quote', 'Private swap or lending quote, after protocol fee'],
        ['GET /v1/positions', 'Lending markets, rates and share prices'],
        ['GET /v1/commitments', 'Indexer: every note commitment and ciphertext, in order'],
        ['GET /v1/nullifiers · /v1/root', 'Indexer: spent markers and the current Merkle root'],
        ['POST /rpc · WS /rpc', 'Solana JSON-RPC and subscriptions'],
      ],
    },
  },
];

export const FEES = [
  ['Shield', '0.3% on top', 'None (your wallet pays the network fee)'],
  ['Private send', 'None', 'Network fee + rent per note spent'],
  ['Private trade / earn', '0.3% of the input', 'Network fee + rent'],
  ['Withdraw', '0.3% of the amount', 'Network fee + rent'],
  ['Private route (multi-hop)', 'Inside the live quote', 'Solana network fee for your deposit'],
  ['Privacy swap (intents)', '0.40% partner fee, in the quote', 'Network costs per chain'],
];

export const VISIBILITY = [
  { a: 'Shield', pub: 'Your wallet, the token and the amount entering', priv: 'Everything you do afterwards' },
  { a: 'Private send', pub: 'That a transfer happened, the relayer fee, 1–4 notes spent', priv: 'Sender, recipient, amount and, with private SOL, the token' },
  { a: 'Private trade', pub: 'The vault traded through an allowlisted route', priv: 'Who traded and from which notes' },
  { a: 'Withdraw', pub: 'A one-time address receiving funds', priv: 'Which notes and which owner paid it' },
  { a: 'Cross-chain swap', pub: 'Solana deposit and the destination payout', priv: 'Swap processing (NEAR confidential shard) and no wallet link' },
];

export const FAQ = [
  ['Does Cadabra ever hold my keys?', 'No. Your vault is generated and encrypted in your browser, and proofs are built there too. The relayer and indexer never see your keys.'],
  ['Can anyone freeze or take my funds?', 'No instruction lets anyone move notes without the owner’s proof. The multisig can pause deposits, transfers and swaps in an emergency, but withdrawals stay open.'],
  ['Do the cross-chain swaps need a wallet connection?', 'No. Private route and Privacy swap are manual-deposit flows. You create an order, then send the exact amount from any Solana wallet. Creating an order never moves funds.'],
  ['What is the difference between ZK Shield and Privacy swap?', 'ZK Shield hides activity inside a zero-knowledge pool on Solana. Privacy swap uses confidential intent processing to move value cross-chain. Different mechanisms, different trust boundaries, one app.'],
  ['Is it anonymous?', 'It hides the link between your wallet and your private activity. How well depends on the crowd and your habits (amounts, timing, tokens). No tool makes you 100% anonymous.'],
  ['What if I lose my recovery key?', 'If you lose both this browser and the recovery key, nobody can restore the funds. Keep the recovery key offline and private.'],
];

// "Real ZK" explainer
export const ZK_SYSTEMS = [
  { k: 'Encryption', q: '“I hid the transaction details so nobody can read them.”', d: 'Protects information, but proves nothing about whether the transaction is valid.', zk: false },
  { k: 'Relayer', q: '“I sent it through another wallet so your address isn’t directly visible.”', d: 'A routing or anonymity technique. Useful, but it isn’t a proof.', zk: false },
  { k: 'Zero-knowledge', q: '“I can mathematically prove this transaction is authorized and valid without revealing the secret behind it.”', d: 'Cadabra uses all three. Only this one gives the cryptographic proof property.', zk: true },
];

export const ZK_PIPELINE = ['Private information', 'ZK circuit', 'Groth16 proof', 'On-chain verifier', 'Accept or reject'];

export const ZK_PROVEN = [
  'I possess a valid note',
  'I am authorized to spend it',
  'The note exists in the committed state of the pool (Poseidon Merkle membership)',
  'The resulting transaction obeys the protocol’s rules: amounts balance and fees are bound',
];
