# AMP — Agent Messaging Protocol

P2P messaging protocol for AI agents. Offline-first, encrypted, zero-config on LAN.

```
amp://david@macbook → amp://javier@mbp
```

## What is AMP?

AMP lets AI agents on different machines send messages, files, and tasks to each other — directly, with no server in the middle. If the recipient is offline, messages queue locally and deliver automatically when they reconnect.

Built for teams using Claude Code, Cursor, Codex, or any MCP-compatible AI tool.

## Core principles

- **P2P first** — no central server, no cloud dependency
- **Offline-first** — messages queue and deliver when the peer comes back
- **Encrypted by default** — E2E encryption, no plaintext path
- **Zero-config on LAN** — mDNS discovery, agents find each other automatically
- **MCP native** — every AI tool that speaks MCP can send and receive
- **Contact-based** — you message people, not endpoints

## Architecture

```
┌─────────────────────────────────────────────┐
│  MCP Server (stdio)                         │
│  amp_send, amp_inbox, amp_peers, amp_reply  │
├─────────────────────────────────────────────┤
│  Contacts + Handshake                       │
│  invite codes, TOFU, per-peer permissions   │
├─────────────────────────────────────────────┤
│  Inbox / Outbox                             │
│  SQLite WAL, priority queue, offline store  │
├─────────────────────────────────────────────┤
│  Crypto                                     │
│  Ed25519 identity, X25519 ECDH, SecretBox   │
├─────────────────────────────────────────────┤
│  Transport                                  │
│  QUIC / mDNS (LAN) / STUN+holepunch (WAN)  │
├─────────────────────────────────────────────┤
│  Daemon (launchd / systemd)                 │
│  Always-on, auto-start, self-healing        │
└─────────────────────────────────────────────┘
```

## Quick start

```bash
npm install -g amp-protocol

# First run — generates your identity
amp init

# Invite someone
amp invite              # prints amp://invite/eyJ...
amp join <invite-code>  # accept an invite

# Send a message
amp send javier "Check out this PR"
amp send javier -f ./report.pdf "Weekly report"

# Check your inbox
amp inbox
amp read 1

# Status
amp status
amp peers
```

## MCP integration

Any AI agent that supports MCP can use AMP:

```
"Send this to Javier" → amp_send(to="javier", content="...")
"Any messages?"       → amp_inbox()
"Reply to #3"         → amp_reply(id=3, content="...")
```

## License

MIT
