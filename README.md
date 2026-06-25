# AMP — Agent Messaging Protocol

P2P encrypted messaging for AI agents. Offline-first. Zero-config on LAN.

```
npm install -g amp-protocol
amp init
```

## What is AMP?

AMP lets AI agents send messages and files to each other across machines — directly, with no server in the middle. If the recipient is offline, messages queue and deliver automatically when they reconnect.

```
amp send javier "Check out this PR"
amp send javier -f ./report.pdf "Weekly report"
```

Built for teams using Claude Code, Cursor, Codex, or any MCP-compatible tool.

## How it works

```
  Your Mac                                    Javier's Mac
┌──────────────┐                          ┌──────────────┐
│ Claude Code  │                          │   Cursor     │
│      ↕ MCP   │                          │      ↕ MCP   │
│  AMP Daemon  │ ◄── encrypted P2P ────► │  AMP Daemon  │
│    :9800     │                          │    :9800     │
│  ┌────────┐  │                          │  ┌────────┐  │
│  │ SQLite │  │     Ed25519 + X25519     │  │ SQLite │  │
│  │ inbox  │  │     NaCl SecretBox       │  │ inbox  │  │
│  └────────┘  │                          │  └────────┘  │
└──────────────┘                          └──────────────┘
```

**The daemon runs as a background service**, starts on login, and handles everything: peer discovery, message delivery, encryption, and file transfer. Your AI tools connect via MCP and get 6 tools: `amp_send`, `amp_inbox`, `amp_read`, `amp_reply`, `amp_peers`, `amp_status`.

## Network discovery

AMP finds peers automatically using three layers, from fastest to broadest:

```
Layer 1: mDNS (Bonjour)          Same WiFi/LAN → instant discovery
Layer 2: Tailscale               Different networks, Tailscale installed → 30s poll
Layer 3: STUN (Google)            Raw internet → public IP discovery for hole-punching
Fallback: Manual                  amp set-address javier 83.45.12.99:9800
```

### How STUN works

STUN discovers your public IP by asking a Google server "what's my address?" — that's all it does. It never sees your messages. Once both peers know each other's public address, they connect directly:

```
David                    STUN Server              Javier
  │── "my public IP?" ────►│                         │
  │◄── "83.45.12.99:4521" ─│                         │
  │                         │◄── "my IP?" ───────────│
  │                         │── "91.22.33.44:7832" ─►│
  │                                                  │
  │◄══════ direct P2P (AMP encrypted) ═════════════►│
  │         STUN is no longer involved               │
```

STUN works ~80% of the time. Symmetric NATs (some corporate networks) block it. In that case, use Tailscale or set the address manually.

## Security

```
Identity        Ed25519 keypair, generated on first run, never leaves your machine
Encryption      X25519 ECDH key exchange + NaCl SecretBox (XSalsa20-Poly1305)
Signing         Every invite code is Ed25519 signed — tamper-proof
Trust model     TOFU (Trust On First Use) — like SSH known_hosts
Contacts        Whitelist-only — unknown peers are rejected silently
Files at rest   Stored in ~/.amp/ with 700 permissions
```

**What a remote peer can do:** send you text and files (up to 50MB).
**What a remote peer cannot do:** read your files, execute commands, access your AI, see your inbox, list your contacts.

## Quick start

### 1. Install

```bash
npm install -g amp-protocol
```

### 2. Initialize

```bash
amp init
```

This does three things:
- Generates your cryptographic identity (`~/.amp/identity.json`)
- Installs the daemon as a background service (launchd on macOS)
- Configures MCP for detected AI tools (Claude Code, Cursor, Codex, Windsurf)

### 3. Connect with someone

On your machine:
```bash
amp invite
# → amp://invite/eyJ2IjoxLCJway...
# Share this code via WhatsApp, Slack, in person, etc.
```

On their machine:
```bash
amp join amp://invite/eyJ2IjoxLCJway...
# → ✓ Peer added as "david"
# Verify the fingerprint with the other person
```

### 4. Send messages

```bash
amp send david "The deploy is ready"
amp send david -f ./design.pdf "New mockups attached"
```

### 5. Check inbox

```bash
amp inbox          # unread messages
amp inbox --all    # all messages
amp read a3f2      # read specific message by ID prefix
```

## CLI reference

```
amp init                          Initialize identity + daemon + MCP
amp status                        Node info, peer count, inbox stats
amp invite                        Generate invite code (expires 15 min)
amp join <code>                   Accept an invite, add peer
amp peers                         List contacts with online status
amp send <peer> <message>         Send a message
amp send <peer> -f <file> <msg>   Send with file attachment (up to 50MB)
amp inbox                         Show unread messages
amp inbox --all                   Show all messages
amp read <id>                     Read and mark as read
amp set-address <peer> <ip:port>  Manually set peer address
```

## MCP tools

After `amp init`, your AI tools get these MCP tools:

| Tool | Description |
|------|-------------|
| `amp_send` | Send a message to a peer |
| `amp_inbox` | Check for new messages |
| `amp_read` | Read a specific message |
| `amp_reply` | Reply to a message |
| `amp_peers` | List contacts |
| `amp_status` | Node status |

Tell your AI: *"Send this to Javier via AMP"* and it calls `amp_send` automatically.

## File transfer

AMP supports sending any file up to 50MB, encrypted end-to-end:

```bash
amp send javier -f ./report.pdf "Q2 report"
amp send javier -f ./screenshot.png "Check this bug"
amp send javier -f ./data.xlsx "Updated numbers"
```

Files are received in `~/.amp/files/<peer>/`.

## Architecture

```
~/.amp/
├── identity.json       # Ed25519 + X25519 keypair (mode 600)
├── amp.db              # SQLite WAL — messages, peers, config
├── daemon.log          # Daemon output
└── files/              # Received files
    └── javier/
        └── report.pdf
```

### Daemon

The daemon is a Node.js HTTP server on port 9800 that:
- Publishes an Agent Card at `/.well-known/agent-card.json`
- Accepts encrypted messages at `POST /amp/send`
- Serves queued messages at `POST /amp/drain`
- Runs the delivery loop every 5 seconds
- Discovers peers via mDNS, Tailscale, and STUN

On macOS, it runs as a launchd service (`com.amp.daemon`) — starts on login, restarts if it crashes.

### Invite handshake

```
David                                        Javier
  │ amp invite                                  │
  │ → signed code with pubkey + address + TTL   │
  │                                             │
  │ ── share via WhatsApp/Slack/in person ────► │
  │                                             │
  │                              amp join <code> │
  │                    verify signature + expiry │
  │                    save peer (TOFU)          │
  │                                             │
  │ ◄── Javier generates his invite ──────────  │
  │ amp join <code>                             │
  │ verify + save                               │
  │                                             │
  │ ═══════ encrypted channel established ═════ │
```

The invite code contains: protocol version, public key, signing key, hostname, address, fingerprint, expiration, and a detached Ed25519 signature. It's base64url-encoded as `amp://invite/...`.

### Delivery

Messages are encrypted with NaCl `box` (X25519 ECDH + XSalsa20-Poly1305) before leaving your machine. The delivery loop runs every 5 seconds:

1. Check outbox for pending messages
2. Look up peer address (mDNS → Tailscale → STUN → manual)
3. Encrypt message with peer's public key
4. POST to peer's `/amp/send` endpoint
5. On success: mark delivered. On failure: retry next round (max 10 attempts)

If the peer is offline, messages stay in the local outbox and deliver automatically when the peer comes back online.

## What AMP is not

- **Not a chatbot framework** — AMP moves messages between machines, it doesn't run AI models
- **Not a cloud service** — no accounts, no servers, no subscriptions
- **Not an orchestrator** — it doesn't coordinate multi-agent workflows (use A2A/MCP for that)
- **Not a blockchain** — no tokens, no gas fees, no consensus

AMP is a transport protocol. Like SMTP for agents.

## Compared to alternatives

| | AMP | c2c | MeshTerm | Google A2A |
|---|---|---|---|---|
| P2P (no server) | ✅ | ❌ relay | ❌ broker | ❌ HTTP server |
| E2E encrypted | ✅ NaCl | ❌ | ❌ | ❌ TLS only |
| Offline delivery | ✅ | ❌ | ❌ | ❌ |
| Zero-config LAN | ✅ mDNS | ❌ | ❌ | ❌ |
| MCP native | ✅ | ✅ | ✅ | ❌ |
| Open source | ✅ MIT | ❌ closed | ✅ | ✅ |
| File transfer | ✅ 50MB | ❌ | ❌ | ❌ |
| Install time | 30 sec | ~5 min | ~5 min | complex |

## Requirements

- Node.js 20+
- macOS or Linux (Windows untested)
- For LAN discovery: Bonjour/Avahi (built into macOS, `avahi-daemon` on Linux)
- For WAN: Tailscale (optional) or port 9800 accessible

## License

MIT
