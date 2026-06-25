<p align="center">
  <strong>A M P</strong>
</p>

<h3 align="center">Agent Messaging Protocol</h3>

<p align="center">
  P2P encrypted messaging for AI agents. Offline-first. Zero-config on LAN.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/amp-protocol"><img src="https://img.shields.io/npm/v/amp-protocol.svg?style=flat&colorA=000000&colorB=000000" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/amp-protocol"><img src="https://img.shields.io/npm/dm/amp-protocol.svg?style=flat&colorA=000000&colorB=000000" alt="npm downloads" /></a>
  <a href="https://github.com/devidbarreiro/AMP/blob/main/LICENSE"><img src="https://img.shields.io/github/license/devidbarreiro/AMP?style=flat&colorA=000000&colorB=000000" alt="license" /></a>
  <a href="https://github.com/devidbarreiro/AMP"><img src="https://img.shields.io/github/stars/devidbarreiro/AMP?style=flat&colorA=000000&colorB=000000" alt="stars" /></a>
</p>

<p align="center">
  <a href="https://devidbarreiro.github.io/AMP/"><strong>Website</strong></a> &nbsp;&middot;&nbsp;
  <a href="#quick-start"><strong>Quick Start</strong></a> &nbsp;&middot;&nbsp;
  <a href="#how-it-works"><strong>How It Works</strong></a> &nbsp;&middot;&nbsp;
  <a href="https://www.npmjs.com/package/amp-protocol"><strong>npm</strong></a>
</p>

---

```bash
npm install -g amp-protocol
amp init
```

That's it. Your AI agent can now send and receive messages.

---

## What is AMP?

AMP is a transport protocol for AI agents — like SMTP, but peer-to-peer. Agents on different machines send messages and files directly to each other. No cloud. No accounts. No API keys.

```
"Send this to Javier via AMP"  →  encrypted, queued, delivered
```

If the recipient is offline, messages queue locally and deliver automatically when they reconnect. Works with Claude Code, Cursor, Codex, Windsurf, and any MCP-compatible tool.

## Quick start

### Install and initialize

```bash
npm install -g amp-protocol
amp init
```

`amp init` does three things:
1. Generates your cryptographic identity (Ed25519 + X25519)
2. Installs the daemon as a background service (launchd)
3. Configures MCP for detected AI tools

### Connect with a peer

```bash
# You generate an invite
amp invite
# → amp://invite/eyJ2Ijox...
# Share via WhatsApp, Slack, in person

# They accept it
amp join amp://invite/eyJ2Ijox...

# They generate their invite, you accept it
# Bidirectional connection established
```

### Send messages

```bash
amp send javier "The deploy is ready"
amp send javier -f ./report.pdf "Q2 numbers attached"
```

### Or let your AI do it

```
> "Send this to Javier via AMP"        → amp_send
> "Any messages for me?"               → amp_inbox
> "Reply to Javier's last message"     → amp_reply
```

## How it works

```
  Your Mac                                    Their Mac
┌──────────────┐                          ┌──────────────┐
│ Claude Code  │                          │   Cursor     │
│      ↕ MCP   │                          │      ↕ MCP   │
│  AMP Daemon  │ ◄── encrypted P2P ────► │  AMP Daemon  │
│    :9800     │                          │    :9800     │
│  ┌────────┐  │     Ed25519 + X25519     │  ┌────────┐  │
│  │ SQLite │  │     NaCl SecretBox       │  │ SQLite │  │
│  │ inbox  │  │                          │  │ inbox  │  │
│  └────────┘  │                          │  └────────┘  │
└──────────────┘                          └──────────────┘
```

The daemon runs in the background, handles peer discovery, message delivery, and encryption. Your AI tools connect via MCP and get six tools: `amp_send`, `amp_inbox`, `amp_read`, `amp_reply`, `amp_peers`, `amp_status`.

## Network discovery

AMP finds peers automatically using three layers:

| Layer | Scope | How |
|-------|-------|-----|
| **mDNS** | Same WiFi/LAN | Bonjour — instant, zero-config |
| **Tailscale** | Different networks | Polls `tailscale status` every 30s |
| **STUN** | Raw internet | Google STUN servers — discovers public IP for hole-punching |
| **Manual** | Fallback | `amp set-address javier 83.45.12.99:9800` |

### STUN — how it works

STUN only asks "what's my public IP?" — it never sees your messages. Once both peers know each other's address, they connect directly:

```
David                    STUN Server              Javier
  │── "my IP?" ───────────►│                         │
  │◄── "83.45.12.99:4521" ─│                         │
  │                         │◄── "my IP?" ───────────│
  │                         │── "91.22.33.44:7832" ─►│
  │                                                  │
  │◄══════════ direct P2P (AMP encrypted) ══════════►│
```

## Security

| Layer | Implementation |
|-------|---------------|
| **Identity** | Ed25519 keypair — generated locally, never transmitted |
| **Key exchange** | X25519 ECDH |
| **Encryption** | NaCl SecretBox (XSalsa20-Poly1305) |
| **Signing** | Ed25519 detached signatures on invite codes |
| **Trust** | TOFU (Trust On First Use) — like SSH `known_hosts` |
| **Contacts** | Whitelist-only — unknown peers rejected silently |
| **At rest** | `~/.amp/` with mode `700` |

**What a remote peer can do:** send you text messages and files (up to 50MB).

**What a remote peer cannot do:** read your files, execute commands, access your AI tools, see your inbox, list your contacts, or run any code on your machine.

## CLI reference

| Command | Description |
|---------|-------------|
| `amp init` | Initialize identity + daemon + MCP |
| `amp status` | Node info, peer count, inbox stats |
| `amp invite` | Generate invite code (expires 15 min) |
| `amp join <code>` | Accept an invite |
| `amp peers` | List contacts with online status |
| `amp send <peer> <msg>` | Send a message |
| `amp send <peer> -f <file> <msg>` | Send with file (up to 50MB) |
| `amp inbox` | Show unread messages |
| `amp inbox --all` | Show all messages |
| `amp read <id>` | Read and mark as read |
| `amp set-address <peer> <ip:port>` | Set peer address manually |

## MCP tools

| Tool | When your AI uses it |
|------|---------------------|
| `amp_send` | "Send this to Javier" |
| `amp_inbox` | "Any new messages?" |
| `amp_read` | "Show me that message" |
| `amp_reply` | "Reply to Javier" |
| `amp_peers` | "Who's online?" |
| `amp_status` | "AMP status" |

## File transfer

Any file up to 50MB. Encrypted end-to-end. Received files go to `~/.amp/files/<peer>/`.

```bash
amp send javier -f ./design.pdf "New mockups"
amp send javier -f ./photo.jpg "From the office"
amp send javier -f ./data.xlsx "Updated sheet"
```

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

### Invite handshake

```
David                                        Javier
  │                                             │
  │  amp invite                                 │
  │  → signed payload: pubkey + addr + TTL      │
  │  → encoded as amp://invite/eyJ...           │
  │                                             │
  │  ── share via WhatsApp / in person ───────► │
  │                                             │
  │                              amp join <code> │
  │                    verify signature + expiry │
  │                    save peer (TOFU)          │
  │                                             │
  │ ◄── Javier sends his invite back ────────── │
  │ amp join <code>                             │
  │ verify + save                               │
  │                                             │
  │ ══════ encrypted channel established ══════ │
```

## Compared to

| | AMP | c2c | MeshTerm | Google A2A |
|---|:---:|:---:|:---:|:---:|
| P2P (no server) | **Yes** | relay | broker | HTTP server |
| E2E encrypted | **NaCl** | — | — | TLS only |
| Offline delivery | **Yes** | — | — | — |
| Zero-config LAN | **mDNS** | — | — | — |
| MCP native | **Yes** | Yes | Yes | — |
| Open source | **MIT** | closed | MIT | Apache |
| File transfer | **50MB** | — | — | — |

## What AMP is not

- Not a chatbot framework — AMP moves messages, it doesn't run models
- Not a cloud service — no accounts, no servers, no subscriptions
- Not an orchestrator — it doesn't coordinate workflows
- Not a blockchain — no tokens, no fees, no consensus

AMP is a transport protocol. Like SMTP for agents.

## Requirements

- Node.js 20+
- macOS or Linux
- For LAN: Bonjour (built into macOS) or Avahi (Linux)
- For WAN: Tailscale (optional) or port 9800 accessible

## Contributing

Contributions welcome. Please open an issue first to discuss.

## License

[MIT](LICENSE)

---

<p align="center">
  <a href="https://devidbarreiro.github.io/AMP/">Website</a> &nbsp;&middot;&nbsp;
  <a href="https://www.npmjs.com/package/amp-protocol">npm</a> &nbsp;&middot;&nbsp;
  <a href="https://github.com/devidbarreiro/AMP">GitHub</a>
</p>
