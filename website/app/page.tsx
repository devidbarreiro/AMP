export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">AMP</span>
            <span className="text-xs text-zinc-500 font-mono">v0.2</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/devidbarreiro/AMP" className="text-sm text-zinc-400 hover:text-white transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/amp-protocol" className="text-sm text-zinc-400 hover:text-white transition-colors">npm</a>
            <a href="#install" className="text-sm bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors">Install</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Open source &middot; MIT License
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="gradient-text">Agent Messaging</span>
            <br />
            Protocol
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12">
            P2P encrypted messaging for AI agents. Send messages and files between machines — directly, with no server in the middle. Offline-first. Zero-config on LAN.
          </p>
          <div className="code-block max-w-md mx-auto text-left glow">
            <div className="text-zinc-500 mb-2">$ Install in 30 seconds</div>
            <div><span className="text-emerald-400">npm</span> install -g amp-protocol</div>
            <div><span className="text-emerald-400">amp</span> init</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            Your AI agent talks to their AI agent. Encrypted, direct, no middleman.
          </p>
          <div className="code-block max-w-3xl mx-auto text-sm">
            <pre className="text-zinc-400">{`  Your Mac                                    Their Mac
┌──────────────┐                          ┌──────────────┐
│ Claude Code  │                          │   Cursor     │
│      ↕ MCP   │                          │      ↕ MCP   │
│  AMP Daemon  │ ◄── encrypted P2P ────► │  AMP Daemon  │
│    :9800     │                          │    :9800     │
│  ┌────────┐  │                          │  ┌────────┐  │
│  │ SQLite │  │     Ed25519 + X25519     │  │ SQLite │  │
│  │ inbox  │  │     NaCl SecretBox       │  │ inbox  │  │
│  └────────┘  │                          │  └────────┘  │
└──────────────┘                          └──────────────┘`}</pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Built for real teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="text-2xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-2">E2E Encrypted</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                NaCl crypto (same as Signal). Ed25519 identity, X25519 key exchange, SecretBox encryption. Your key never leaves your machine.
              </p>
            </div>
            <div className="feature-card">
              <div className="text-2xl mb-4">📡</div>
              <h3 className="text-lg font-semibold mb-2">Zero-config discovery</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Same WiFi? mDNS finds peers instantly. Different networks? Tailscale or STUN hole-punching. Always P2P, never through a server.
              </p>
            </div>
            <div className="feature-card">
              <div className="text-2xl mb-4">💤</div>
              <h3 className="text-lg font-semibold mb-2">Offline-first</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Peer offline? Messages queue locally and deliver automatically when they reconnect. No messages lost, ever.
              </p>
            </div>
            <div className="feature-card">
              <div className="text-2xl mb-4">🔌</div>
              <h3 className="text-lg font-semibold mb-2">MCP native</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Works with Claude Code, Cursor, Codex, and Windsurf out of the box. &quot;Send this to Javier&quot; just works.
              </p>
            </div>
            <div className="feature-card">
              <div className="text-2xl mb-4">📎</div>
              <h3 className="text-lg font-semibold mb-2">File transfer</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Send any file up to 50MB — PDFs, images, spreadsheets, code. Encrypted in transit and at rest.
              </p>
            </div>
            <div className="feature-card">
              <div className="text-2xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">Contact-based</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                You message people, not endpoints. Invite codes with cryptographic verification. Unknown peers are rejected silently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Network layers */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Three layers of discovery</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-6 feature-card">
              <div className="text-3xl font-bold text-zinc-700 font-mono shrink-0 w-8">1</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">mDNS <span className="text-xs text-emerald-400 font-mono ml-2">same network</span></h3>
                <p className="text-sm text-zinc-400">Bonjour/Avahi discovery. Agents on the same WiFi find each other instantly. Zero configuration.</p>
              </div>
            </div>
            <div className="flex items-start gap-6 feature-card">
              <div className="text-3xl font-bold text-zinc-700 font-mono shrink-0 w-8">2</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Tailscale <span className="text-xs text-blue-400 font-mono ml-2">different networks</span></h3>
                <p className="text-sm text-zinc-400">If both machines have Tailscale, AMP resolves the peer IP automatically every 30 seconds. No manual config.</p>
              </div>
            </div>
            <div className="flex items-start gap-6 feature-card">
              <div className="text-3xl font-bold text-zinc-700 font-mono shrink-0 w-8">3</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">STUN <span className="text-xs text-purple-400 font-mono ml-2">raw internet</span></h3>
                <p className="text-sm text-zinc-400">Discovers your public IP via Google STUN servers for NAT hole-punching. The STUN server never sees your messages — only your public address.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Get started in 30 seconds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Step 1 — Install & init</div>
              <div className="code-block">
                <div><span className="text-emerald-400">npm</span> install -g amp-protocol</div>
                <div><span className="text-emerald-400">amp</span> init</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Step 2 — Connect</div>
              <div className="code-block">
                <div><span className="text-emerald-400">amp</span> invite</div>
                <div className="text-zinc-600"># share the code with a peer</div>
                <div><span className="text-emerald-400">amp</span> join amp://invite/...</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Step 3 — Send messages</div>
              <div className="code-block">
                <div><span className="text-emerald-400">amp</span> send javier &quot;Check this PR&quot;</div>
                <div><span className="text-emerald-400">amp</span> send javier -f report.pdf &quot;Q2&quot;</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Step 4 — Or let your AI do it</div>
              <div className="code-block">
                <div className="text-zinc-400">&gt; Send this to Javier via AMP</div>
                <div className="text-zinc-400">&gt; Any messages for me?</div>
                <div className="text-zinc-400">&gt; Reply to Javier&apos;s message</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Compared to alternatives</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-medium text-zinc-400"></th>
                  <th className="text-center py-3 px-4 font-bold">AMP</th>
                  <th className="text-center py-3 px-4 font-medium text-zinc-400">c2c</th>
                  <th className="text-center py-3 px-4 font-medium text-zinc-400">MeshTerm</th>
                  <th className="text-center py-3 px-4 font-medium text-zinc-400">Google A2A</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">P2P (no server)</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                  <td className="text-center py-3 px-4 text-zinc-600">relay</td>
                  <td className="text-center py-3 px-4 text-zinc-600">broker</td>
                  <td className="text-center py-3 px-4 text-zinc-600">HTTP</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">E2E encrypted</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓ NaCl</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">TLS</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Offline delivery</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Zero-config LAN</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓ mDNS</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">MCP native</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Open source</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓ MIT</td>
                  <td className="text-center py-3 px-4 text-zinc-600">closed</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">File transfer</td>
                  <td className="text-center py-3 px-4 text-emerald-400">✓ 50MB</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                  <td className="text-center py-3 px-4 text-zinc-600">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Security by default</h2>
          <p className="text-zinc-400 mb-12 max-w-xl mx-auto">
            Not an afterthought. Every message is encrypted before it leaves your machine.
          </p>
          <div className="code-block text-left max-w-lg mx-auto text-sm">
            <div><span className="text-zinc-500">Identity</span>     Ed25519 keypair</div>
            <div><span className="text-zinc-500">Exchange</span>     X25519 ECDH</div>
            <div><span className="text-zinc-500">Encryption</span>   XSalsa20-Poly1305 (NaCl)</div>
            <div><span className="text-zinc-500">Trust</span>        TOFU (like SSH)</div>
            <div><span className="text-zinc-500">Contacts</span>     Whitelist-only</div>
            <div><span className="text-zinc-500">At rest</span>      ~/.amp/ mode 700</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xl font-bold">AMP</span>
            <span className="text-zinc-500 text-sm ml-3">Agent Messaging Protocol</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-zinc-500">
            <a href="https://github.com/devidbarreiro/AMP" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/amp-protocol" className="hover:text-white transition-colors">npm</a>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
