# PRODUCT.md — AMP Landing Page

## Product Purpose
Landing page for AMP (Agent Messaging Protocol), an open-source P2P encrypted messaging protocol for AI agents. The page needs to communicate what AMP is, why it matters, and how to get started — all in under 60 seconds of reading.

## Users
- **Primary**: developers using AI coding tools (Claude Code, Cursor, Codex) who want their agents to communicate across machines
- **Secondary**: engineering leads evaluating agent infrastructure for their teams
- **Tertiary**: open-source enthusiasts discovering the project on GitHub/HN

All users are technical. They read code, they value substance over marketing. They've seen too many generic SaaS landings. They want to understand the architecture, not just the pitch.

## Register
brand

## Brand Voice
- **Tone**: confident, technical, no-bullshit. Like talking to a senior engineer who respects your time.
- **Not**: corporate, salesy, "revolutionary", emoji-heavy, or breathlessly enthusiastic.
- **Copy style**: short sentences. Code speaks louder than copy. Show the terminal, not the tagline.

## Anti-references
- Generic SaaS gradient landings (too many rounded cards, pastel gradients)
- Crypto/Web3 neon-on-black aesthetic
- Enterprise B2B "trusted by" logos walls
- Overly minimalist "just text" pages with no visual interest
- Dark mode that's just "invert colors"

## What makes AMP different
1. True P2P — no server, no relay, no cloud dependency
2. E2E encrypted by default (NaCl, same crypto as Signal)
3. Offline-first — messages queue and deliver when the peer reconnects
4. MCP native — works inside any AI coding tool as first-class tools
5. Zero-config on LAN (mDNS), Tailscale for WAN, STUN for raw internet
6. Contact-based — you message people, not endpoints

## Emotional goal
The visitor should feel: "This is serious infrastructure, built by someone who knows what they're doing. I want to try this right now."

## Key sections
1. Hero — what AMP is in one glance
2. Architecture — the P2P diagram, show the daemon
3. Network discovery — three layers (mDNS → Tailscale → STUN)
4. Security — the crypto stack
5. Get started — terminal with install commands
6. Comparison table — vs alternatives
