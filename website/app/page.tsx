import { Suspense } from "react";
import ScrollReveal from "./components/ScrollReveal";
import NetworkDiagram from "./components/NetworkDiagram";
import CopyPill from "./components/CopyPill";
import Terminal from "./components/Terminal";
import Hero3DWrapper from "./components/Hero3DWrapper";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import AnimatedCode from "./components/AnimatedCode";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ──────────────────────────── Nav ──────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/70 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight text-zinc-100">
              AMP
            </span>
            <span className="text-[10px] text-zinc-600 font-mono tracking-wide">
              v0.2
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/devidbarreiro/AMP"
              className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/amp-protocol"
              className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              npm
            </a>
            <a
              href="#install"
              className="text-sm text-zinc-950 bg-zinc-100 px-4 py-1.5 rounded-md font-medium hover:bg-white transition-colors"
            >
              Install
            </a>
          </div>
        </div>
      </nav>

      {/* ──────────────────────────── Hero ──────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-14">
        {/* 3D background */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Suspense fallback={null}>
            <Hero3DWrapper />
          </Suspense>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm font-mono text-zinc-500 tracking-wide mb-6">
            Open source. MIT licensed. No servers.
          </p>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] text-zinc-100 mb-6">
            Agent Messaging
            <br />
            Protocol
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-10">
            P2P encrypted messaging for AI agents. Direct communication between
            machines with no server in the middle. Offline-first, zero-config on LAN.
          </p>

          <CopyPill
            text="npm install -g amp-protocol"
            className="mx-auto mb-8"
          />

          <div className="flex items-center justify-center gap-4">
            <a
              href="#install"
              className="text-sm font-medium px-6 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Get Started
            </a>
            <a
              href="https://github.com/devidbarreiro/AMP"
              className="text-sm font-medium px-6 py-2.5 rounded-md border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ──────────────────────── Architecture ──────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-3 text-zinc-100">
              How it works
            </h2>
            <p className="text-zinc-500 mb-10 max-w-lg">
              Your agent talks to their agent. Encrypted, direct, no middleman.
            </p>
          </ScrollReveal>

          <ArchitectureDiagram />
        </div>
      </section>

      {/* ──────────────────────── Features ──────────────────────── */}
      <section className="py-28 px-6 bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-16 text-zinc-100">
              Built for real teams
            </h2>
          </ScrollReveal>

          {/* Feature 1: Full-width statement */}
          <ScrollReveal delay={0.05}>
            <div className="mb-16">
              <h3 className="text-4xl sm:text-5xl font-extrabold text-zinc-200 leading-tight max-w-2xl">
                End-to-end encrypted by default
              </h3>
              <p className="text-zinc-500 mt-4 max-w-lg text-lg">
                NaCl crypto, same as Signal. Ed25519 identity, X25519 key
                exchange, SecretBox encryption. Your key never leaves your
                machine.
              </p>
            </div>
          </ScrollReveal>

          {/* Feature 2 + 3: Side by side with code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <ScrollReveal delay={0.1}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Discovery
                </p>
                <h3 className="text-xl font-bold text-zinc-200 mb-2">
                  Zero-config peer discovery
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Same WiFi? mDNS finds peers instantly. Different networks?
                  Tailscale or STUN hole-punching. Always P2P, never through a
                  server.
                </p>
              </div>
            </ScrollReveal>
            <AnimatedCode
              title="peer discovery"
              lines={[
                { text: '$ amp peers', color: 'command', delay: 200 },
                { text: '', delay: 100 },
                { text: '  javier  192.168.1.42  (mDNS)  12ms', color: 'success', delay: 300 },
                { text: '  maria   100.64.0.3    (TS)    34ms', color: 'accent', delay: 300 },
                { text: '  pablo   83.45.12.99   (STUN)  89ms', color: 'peer', delay: 300 },
              ]}
            />
          </div>

          {/* Feature 4 + 5: reversed layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <AnimatedCode
              title="offline delivery"
              lines={[
                { text: '$ amp send javier "Deploy is ready"', color: 'command', delay: 200 },
                { text: '  ⏳ Queued (javier offline)', color: 'warning', delay: 800 },
                { text: '', delay: 400 },
                { text: '  # 20 minutes later...', color: 'muted', delay: 1000 },
                { text: '  ✓ Delivered to javier (auto)', color: 'success', delay: 600 },
              ]}
            />
            <ScrollReveal delay={0.2}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Reliability
                </p>
                <h3 className="text-xl font-bold text-zinc-200 mb-2">
                  Offline-first delivery
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Peer offline? Messages queue locally in SQLite and deliver
                  automatically when they reconnect. No messages lost.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Feature 6: Compact pair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            <ScrollReveal delay={0.1}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Integration
                </p>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">
                  MCP native
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Works with Claude Code, Cursor, Codex, and Windsurf out of the
                  box. &quot;Send this to Javier&quot; just works.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Transfer
                </p>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">
                  Encrypted file sharing
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Send any file up to 50MB. PDFs, images, spreadsheets, code.
                  Encrypted in transit and at rest.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ──────────────────── Network Discovery ──────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-center mb-3 text-zinc-100">
              Three layers of discovery
            </h2>
            <p className="text-zinc-500 text-center mb-16 max-w-md mx-auto">
              AMP tries each layer in order. The first one that connects wins.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <ScrollReveal delay={0.1}>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      01
                    </span>
                    <h3 className="text-base font-semibold text-zinc-200">
                      mDNS
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-600">
                      same network
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 pl-9">
                    Bonjour/Avahi discovery. Agents on the same WiFi find each
                    other instantly. Zero configuration.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-mono font-bold text-blue-500">
                      02
                    </span>
                    <h3 className="text-base font-semibold text-zinc-200">
                      Tailscale
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-600">
                      different networks
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 pl-9">
                    If both machines run Tailscale, AMP resolves the peer IP
                    automatically every 30 seconds. No manual config.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-mono font-bold text-purple-500">
                      03
                    </span>
                    <h3 className="text-base font-semibold text-zinc-200">
                      STUN
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-600">
                      raw internet
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 pl-9">
                    Discovers your public IP via STUN servers for NAT
                    hole-punching. The STUN server never sees your messages,
                    only your public address.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <NetworkDiagram />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ──────────────────────── Terminal ──────────────────────── */}
      <section className="py-28 px-6 bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-center mb-3 text-zinc-100">
              See it in action
            </h2>
            <p className="text-zinc-500 text-center mb-12 max-w-md mx-auto">
              Install, connect, and start messaging in under a minute.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <Terminal />
          </ScrollReveal>
        </div>
      </section>

      {/* ──────────────────────── Security ──────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-3 text-zinc-100">
              Security by default
            </h2>
            <p className="text-zinc-500 mb-10 max-w-lg">
              Not an afterthought. Every message is encrypted before it leaves
              your machine.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="space-y-0">
              {[
                { label: "Identity", value: "Ed25519 keypair" },
                { label: "Exchange", value: "X25519 ECDH" },
                { label: "Encryption", value: "XSalsa20-Poly1305 (NaCl)" },
                { label: "Trust model", value: "TOFU, same as SSH" },
                { label: "Contacts", value: "Whitelist-only" },
                { label: "At rest", value: "~/.amp/ mode 700" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline py-3 border-b border-zinc-800/50"
                >
                  <span className="text-sm font-mono text-zinc-600 w-32 shrink-0">
                    {item.label}
                  </span>
                  <span className="text-sm text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ──────────────────────── Install ──────────────────────── */}
      <section id="install" className="py-28 px-6 bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-12 text-zinc-100">
              Get started
            </h2>
          </ScrollReveal>

          <div className="space-y-10">
            <ScrollReveal delay={0.05}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Step 1. Install and initialize
                </p>
                <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-5">
                  <pre className="text-[13px] leading-loose text-zinc-400 font-mono">
                    <span className="text-zinc-600">$</span>{" "}
                    <span className="text-zinc-300">npm install -g amp-protocol</span>
                    {"\n"}
                    <span className="text-zinc-600">$</span>{" "}
                    <span className="text-zinc-300">amp init</span>
                  </pre>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Step 2. Connect with a peer
                </p>
                <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-5">
                  <pre className="text-[13px] leading-loose text-zinc-400 font-mono">
                    <span className="text-zinc-600">$</span>{" "}
                    <span className="text-zinc-300">amp invite</span>
                    {"\n"}
                    <span className="text-zinc-600"># share the code with a peer</span>
                    {"\n"}
                    <span className="text-zinc-600">$</span>{" "}
                    <span className="text-zinc-300">amp join amp://invite/...</span>
                  </pre>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
                  Step 3. Send messages
                </p>
                <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-5">
                  <pre className="text-[13px] leading-loose text-zinc-400 font-mono">
                    <span className="text-zinc-600">$</span>{" "}
                    <span className="text-zinc-300">
                      amp send javier &quot;Check this PR&quot;
                    </span>
                    {"\n"}
                    <span className="text-zinc-600">$</span>{" "}
                    <span className="text-zinc-300">
                      amp send javier -f report.pdf &quot;Q2 numbers&quot;
                    </span>
                    {"\n"}
                    {"\n"}
                    <span className="text-zinc-600"># or let your AI handle it</span>
                    {"\n"}
                    <span className="text-zinc-500">
                      &gt; &quot;Send this to Javier via AMP&quot;
                    </span>
                  </pre>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ──────────────────── Comparison ──────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-10 text-zinc-100">
              Compared to alternatives
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 pr-6 font-normal text-zinc-600" />
                    <th className="text-center py-3 px-4 font-semibold text-zinc-200">
                      AMP
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600">
                      c2c
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600">
                      MeshTerm
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600">
                      Google A2A
                    </th>
                  </tr>
                </thead>
                <tbody className="text-zinc-500">
                  {[
                    {
                      feature: "P2P (no server)",
                      amp: "yes",
                      c2c: "relay",
                      mesh: "broker",
                      a2a: "HTTP",
                    },
                    {
                      feature: "E2E encrypted",
                      amp: "NaCl",
                      c2c: "no",
                      mesh: "no",
                      a2a: "TLS",
                    },
                    {
                      feature: "Offline delivery",
                      amp: "yes",
                      c2c: "no",
                      mesh: "no",
                      a2a: "no",
                    },
                    {
                      feature: "Zero-config LAN",
                      amp: "mDNS",
                      c2c: "no",
                      mesh: "no",
                      a2a: "no",
                    },
                    {
                      feature: "MCP native",
                      amp: "yes",
                      c2c: "yes",
                      mesh: "yes",
                      a2a: "no",
                    },
                    {
                      feature: "Open source",
                      amp: "MIT",
                      c2c: "closed",
                      mesh: "yes",
                      a2a: "yes",
                    },
                    {
                      feature: "File transfer",
                      amp: "50MB",
                      c2c: "no",
                      mesh: "no",
                      a2a: "no",
                    },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-zinc-900">
                      <td className="py-3 pr-6 text-zinc-400">
                        {row.feature}
                      </td>
                      <td className="text-center py-3 px-4 text-zinc-200 font-medium">
                        {row.amp}
                      </td>
                      <td className="text-center py-3 px-4 text-zinc-700">
                        {row.c2c}
                      </td>
                      <td className="text-center py-3 px-4 text-zinc-700">
                        {row.mesh}
                      </td>
                      <td className="text-center py-3 px-4 text-zinc-700">
                        {row.a2a}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ──────────────────────── Footer ──────────────────────── */}
      <footer className="py-12 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-zinc-300">AMP</span>
            <span className="text-xs text-zinc-600">
              Agent Messaging Protocol
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <a
              href="https://github.com/devidbarreiro/AMP"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/amp-protocol"
              className="hover:text-zinc-300 transition-colors"
            >
              npm
            </a>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
