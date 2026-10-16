// BlindSpot documentation: written fresh for the /docs page.
// Structure: groups -> pages -> blocks. Block kinds: p, steps, list, code, table, note, kv.

export const DOC_GROUPS = [
  {
    id: 'start',
    title: 'Start here',
    pages: [
      {
        id: 'overview',
        title: 'What BlindSpot is',
        lead: 'BlindSpot is a Solana-first privacy protocol: a shielded pool for private balances, payments and swaps, plus a quantum-safe vault for long-term SOL.',
        blocks: [
          { k: 'p', t: 'Think of it as two layers. Your normal wallet is the street-level account everyone can look at. Your BlindSpot vault is a back room on the same chain: the network can confirm every action in it is valid, but it cannot see who did it, how much moved, or (if you pay fees in private SOL) which token was involved.' },
          { k: 'kv', rows: [
            ['Chain', 'Solana mainnet, first and natively. Other chains are reached through private routes'],
            ['Shielded pool', 'Private balances, payments, swaps and exits on Solana'],
            ['Quantum-safe vault', 'Holds SOL behind hash-based signatures from your passkey or 24 words'],
            ['Custody', 'Non-custodial; secrets are created and kept in your browser'],
            ['Privacy engine', 'Zero-knowledge proofs (Groth16) over a shared note pool'],
            ['Ways out', 'Fresh one-time Solana address, or any chain via cross-chain routes'],
          ] },
          { k: 'note', t: 'Privacy grows with the crowd. Odd amounts, instant in-and-out timing and rare tokens make you easier to spot, so spread things out.' },
        ],
      },
      {
        id: 'quickstart',
        title: 'Quickstart',
        lead: 'From zero to your first private payment in about two minutes.',
        blocks: [
          { k: 'steps', items: [
            ['Open a vault', 'Hit Create account and pick Create a BlindSpot vault. Choose a password for this device. You get a recovery key once; store it offline.'],
            ['Shield', 'Go to Shield, pick a token and amount, and approve one signature from your public wallet. Your tokens become sealed notes.'],
            ['Use it', 'Send to any blind2… address, trade inside the pool, or exit. No pop-ups: a relayer submits each proof for you.'],
            ['Leave', 'Withdraw to a brand-new address, or use Private route / Privacy swap to land on another chain.'],
          ] },
        ],
      },
      {
        id: 'no-wallet',
        title: 'Swapping without a vault',
        lead: 'You can bridge out of Solana privately without creating anything.',
        blocks: [
          { k: 'p', t: 'Private route and Privacy swap both run on a manual-deposit model. You get a quote, place an order, and then decide whether to fund it by sending SOL or a token from any wallet you like. Placing the order itself moves nothing.' },
          { k: 'list', items: ['No sign-up and no wallet connection', 'Each order has its own deposit address and deadline', 'Track any order with its receipt ID'] },
        ],
      },
    ],
  },
  {
    id: 'concepts',
    title: 'Concepts',
    pages: [
      {
        id: 'notes',
        title: 'Notes and the pool',
        lead: 'Your private balance is not a number on-chain; it is a set of sealed notes only you can open.',
        blocks: [
          { k: 'p', t: 'A note bundles four things: a token mint, an amount, an owner key and a random blinding value. What lands on-chain is only its fingerprint (a commitment), written as a leaf in a Poseidon Merkle tree that is 26 levels deep, which is room for 67,108,864 notes.' },
          { k: 'p', t: 'When you spend a note you publish its nullifier, a one-way tag the program stores in a spent list. The same note can never be spent twice, and nobody can trace which commitment a nullifier belongs to.' },
          { k: 'p', t: 'Incoming payments are found by your browser trial-decrypting each new note ciphertext with your viewing key. The indexer serves everyone the same feed, so it never learns which notes are yours.' },
        ],
      },
      {
        id: 'proofs',
        title: 'Proofs, not promises',
        lead: 'Encryption hides data and relayers hide senders, but only a proof shows the chain the action is legitimate.',
        blocks: [
          { k: 'p', t: 'Every private action ships with a zero-knowledge proof that says, in effect: I own a note that is really in the pool, I am allowed to spend it, and the totals add up. The verifier checks the maths and learns nothing else.' },
          { k: 'list', items: [
            'Membership: each spent note sits under the current Merkle root',
            'Authority: the spender holds the matching spending key',
            'Uniqueness: nullifiers are derived correctly, so no double-spends',
            'Conservation: inputs + public amount = outputs + fees',
          ] },
          { k: 'code', t: 'proof system   Groth16 on BN254\ncircuit        Transaction(levels 26, in 4, out 3)\npublic inputs  13\nhashing        Poseidon\non-chain check alt_bn128 syscalls' },
        ],
      },
      {
        id: 'relayers',
        title: 'Relayers',
        lead: 'Someone has to pay Solana gas; it should not be you, because your wallet would show up.',
        blocks: [
          { k: 'p', t: 'A relayer takes your finished proof, wraps it in a transaction and pays the network fee, taking a small relayer fee from the note in return. The recipient, amount, fee and any swap terms are bound into the proof hash, so a relayer that tampers with anything just produces a failed transaction.' },
          { k: 'p', t: 'Private trades run in two moves. swap_prepare locks the input into a dedicated escrow, then swap_execute runs the route. The program confirms the escrow paid exactly the input and the vault got at least your minimum; if not, swap_refund puts everything back.' },
        ],
      },
      {
        id: 'keys',
        title: 'Keys and recovery',
        lead: 'One random seed, several keys, and nothing tied to your public wallet.',
        blocks: [
          { k: 'p', t: 'Your vault starts as 32 random bytes. From that seed the browser derives a spending key, a viewing key and an endless supply of single-use receive addresses. On this device the bundle is locked with your password (PBKDF2 at 600k rounds, then AES-GCM).' },
          { k: 'p', t: 'The recovery key is shown once and restores the whole vault anywhere. Because it is independent of your public wallet, losing one never exposes the other.' },
          { k: 'note', t: 'There is no reset button. If both this browser and the recovery key are gone, the funds are unrecoverable.' },
        ],
      },
    ],
  },
  {
    id: 'crosschain',
    title: 'Cross-chain',
    pages: [
      {
        id: 'private-route',
        title: 'Private route',
        lead: 'Multi-hop swaps out of Solana to any chain, compared side by side.',
        blocks: [
          { k: 'steps', items: [
            ['Pick a pair', 'Choose a Solana token to send and any destination token and chain.'],
            ['Compare', 'Several live routes appear with output, ETA and limits. They refresh before they expire.'],
            ['Place the order', 'Add the receiving address. You get a deposit address, plus a memo if one is required.'],
            ['Fund it', 'Send the exact amount on Solana before the timer runs out.'],
            ['Watch it', 'Status runs: waiting for deposit, confirming, exchanging, sending, completed.'],
          ] },
          { k: 'note', t: 'The minimum order is worth about $3. That is a size floor, not a charge; provider fees and price impact are already inside the quoted output.' },
        ],
      },
      {
        id: 'privacy-swap',
        title: 'Privacy swap',
        lead: 'Intent-based swaps where solvers compete to fill your order inside a confidential shard.',
        blocks: [
          { k: 'p', t: 'You describe the outcome you want: an exact Solana input, a destination asset and chain, a recipient and a Solana refund address. Market makers bid to deliver it and the best bid becomes your quote. Once you confirm, you get deposit instructions; after your deposit lands the solver pays out on the destination chain and the settlement contract finalises atomically. Failures refund to your Solana address.' },
          { k: 'p', t: 'Processing happens in a private shard run by permissioned validators, with encryption and restricted visibility. That is confidential execution rather than a zero-knowledge pool, so those validators sit inside the trust boundary.' },
          { k: 'kv', rows: [
            ['Destinations', 'Solana, NEAR, Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, plus native Zcash (receive-only, shielded address)'],
            ['Partner fee', '0.40%, already reflected in the quote'],
            ['Refunds', 'Always to the Solana refund address you set'],
          ] },
        ],
      },
      {
        id: 'tracking',
        title: 'Tracking an order',
        lead: 'Every order gets a receipt ID you can look up at any time.',
        blocks: [
          { k: 'p', t: 'Open Track, paste the receipt ID and the page polls the live status every few seconds. Recent orders are remembered in this browser so you can jump back with one tap.' },
        ],
      },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    pages: [
      {
        id: 'program',
        title: 'On-chain instructions',
        lead: 'What the Solana program exposes.',
        blocks: [
          { k: 'table', cols: ['Instruction', 'What it does'], rows: [
            ['transact', 'The workhorse: one proof covers a deposit, a payment or a cash-out, burning up to 4 notes and minting up to 3'],
            ['swap_prepare / swap_execute / swap_refund', 'Escrow first, run the venue second, and roll back automatically if the minimum is missed'],
            ['register_asset', 'Adds support for a new coin; permissionless, with on-chain screening'],
            ['collect_fees', 'Sweeps what the protocol has earned into its treasury'],
            ['set_* / accept_admin', 'Admin knobs behind a 2-of-2 multisig (rates, limits, venue list, emergency pause). None of them can touch user notes'],
          ] },
        ],
      },
      {
        id: 'api',
        title: 'Relayer and indexer API',
        lead: 'Plain HTTP and JSON-RPC, served through the gateway. No secrets ever leave your device.',
        blocks: [
          { k: 'table', cols: ['Endpoint', 'Purpose'], rows: [
            ['GET /v1/info', 'Who the relayer is, which venues are approved, current rates'],
            ['GET /v1/fee?mint&inputs', 'Price check: relayer cost for this coin and this many notes'],
            ['POST /v1/relay', 'Hand over a finished proof and let the relayer broadcast it'],
            ['POST /v1/sponsor', 'Lets a deposit go through with the relayer covering gas, after a strict check'],
            ['GET /v1/quote', 'What a private trade or lending move would return, net of protocol cut'],
            ['GET /v1/positions', 'Live lending markets with rates and share prices'],
            ['GET /v1/commitments', 'The full ordered stream of note fingerprints and ciphertexts'],
            ['GET /v1/nullifiers, /v1/root', 'Everything already spent, plus the latest tree root'],
            ['POST /rpc, WS /rpc', 'A plain Solana RPC endpoint with live subscriptions'],
          ] },
          { k: 'code', t: 'GET  /api/ds/tokens?side=source|destination&term=&chain=\nGET  /api/ds/quotes?from=&to=&amount=\nPOST /api/ds/orders        { from, to, amount, address, ... }\nGET  /api/ds/orders/{id}   -> status, deposit, payout' },
        ],
      },
      {
        id: 'fees',
        title: 'Fees',
        lead: 'Every cost is shown before you confirm. Private sends carry no BlindSpot fee.',
        blocks: [
          { k: 'fees' },
        ],
      },
      {
        id: 'visibility',
        title: 'What is public',
        lead: 'An honest map of what the chain can and cannot see.',
        blocks: [
          { k: 'visibility' },
        ],
      },
    ],
  },
  {
    id: 'research',
    title: 'Protocol research',
    pages: [
      {
        id: 'solana-first',
        title: 'Why Solana first',
        lead: 'Privacy only works when people actually use it. Solana makes private moves cheap and fast enough to be everyday.',
        blocks: [
          { k: 'p', t: 'A shielded pool is only as private as its crowd. Low fees and fast finality mean people can shield, pay and exit in normal amounts and at normal times, which keeps the anonymity set large and lively. That is why BlindSpot is built on Solana first and reaches other chains through private routes rather than spreading thin across many pools.' },
          { k: 'list', items: ['One deep pool instead of many shallow ones', 'Proof verification on-chain, paid in cents', 'Cross-chain exits without bridging your identity along'] },
        ],
      },
      {
        id: 'quantum',
        title: 'The quantum question',
        lead: 'What a large quantum computer would break, what it would not, and where BlindSpot stands today.',
        blocks: [
          { k: 'p', t: 'Large quantum computers would threaten the elliptic-curve maths behind most of crypto: ordinary Solana wallet signatures (Ed25519) and pairing-based proof systems. Hash functions are expected to hold up, with larger security margins.' },
          { k: 'table', cols: ['Part', 'Status against quantum attacks'], rows: [
            ['vault', 'Quantum-safe: SOL is released only against a hash-based signature'],
            ['wallet', 'Ordinary Solana signatures (Ed25519) are not quantum-safe'],
            ['proofs', 'Groth16 pool proofs are pairing-based and not post-quantum'],
            ['notes', 'Commitments are hash-based; note encryption is the main harvest-now, decrypt-later concern'],
          ] },
          { k: 'note', t: 'BlindSpot does not claim the shielded pool is quantum-proof today. The vault is the quantum-safe part; the rest is active research.' },
        ],
      },
      {
        id: 'quantum-vault',
        title: 'Quantum-safe vault',
        lead: 'A place for SOL you plan to hold for years.',
        blocks: [
          { k: 'p', t: 'The vault is an on-chain program that pays out only against a hash-based signature. Its keys come from your passkey (Face ID / Touch ID) or a 24-word phrase and never leave your device. Because the security rests on hash functions rather than elliptic curves, it is designed to survive a future quantum computer.' },
          { k: 'steps', items: [
            ['Open', 'Create a vault with your passkey or 24 words.'],
            ['Fill', 'Send SOL to the vault address from any wallet.'],
            ['Release', 'Sign a payout with your vault keys; the program checks the hash-based signature on-chain.'],
          ] },
        ],
      },
      {
        id: 'roadmap',
        title: 'Research directions',
        lead: 'What we are exploring next. None of this is live yet.',
        blocks: [
          { k: 'list', items: [
            'Post-quantum proof systems (hash-based / STARK-style) for the shielded pool',
            'Post-quantum key exchange (ML-KEM) for note encryption',
            'Moving vault-held SOL into the pool without an elliptic-curve step',
            'Bigger, healthier anonymity sets: batching and timing guidance built into the app',
          ] },
          { k: 'note', t: 'Research items are shared openly so you can judge them. Treat them as direction, not promises.' },
        ],
      },
    ],
  },
  {
    id: 'safety',
    title: 'Staying safe',
    pages: [
      {
        id: 'habits',
        title: 'Good habits',
        lead: 'The protocol hides links. Your habits decide how well.',
        blocks: [
          { k: 'list', items: [
            'Let funds sit a while between shielding and withdrawing',
            'Avoid unique amounts; round numbers blend in',
            'Keep some private SOL so fees do not reveal the token',
            'Withdraw to a fresh address, never back to the wallet you shielded from',
            'Store the recovery key offline, away from this device',
          ] },
          { k: 'note', t: 'No tool makes anyone 100% anonymous. BlindSpot removes the on-chain link; it cannot hide patterns you create yourself.' },
        ],
      },
    ],
  },
];
