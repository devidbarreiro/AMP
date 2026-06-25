#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ensureIdentity, fingerprint } from '../crypto/identity.js';
import { getDb, closeDb } from '../store/database.js';
import { queueOutbound, getUnreadInbox, markAsRead, getInboxStats, getAllInbox } from '../store/inbox.js';
import { listPeers, getPeer } from '../contacts/peers.js';
import { createInvite, parseInvite } from '../contacts/invite.js';
import { addPeer } from '../contacts/peers.js';
import util from 'tweetnacl-util';
const { decodeBase64 } = util;
import { hostname } from 'node:os';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { homedir } from 'node:os';
import { installDaemon, isDaemonRunning } from '../daemon/install.js';

const program = new Command();

program
  .name('amp')
  .description('AMP — Agent Messaging Protocol')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize AMP — identity + daemon + MCP config')
  .option('--no-daemon', 'Skip daemon installation')
  .option('--no-mcp', 'Skip MCP configuration')
  .action((opts: { daemon?: boolean; mcp?: boolean }) => {
    const identity = ensureIdentity();
    getDb();
    const fp = fingerprint(identity.publicKey);
    console.log(chalk.green('✓ Identity created'));
    console.log(`  Fingerprint: ${chalk.cyan(fp)}`);
    console.log(`  Data dir:    ${chalk.dim('~/.amp/')}`);

    // Install daemon
    if (opts.daemon !== false) {
      try {
        const { plistPath } = installDaemon();
        console.log(chalk.green('✓ Daemon installed (auto-start on login)'));
        console.log(`  Port: ${chalk.dim('9800')}`);
      } catch (err) {
        console.log(chalk.yellow(`⚠ Daemon install skipped: ${(err as Error).message}`));
      }
    }

    // Configure MCP for detected AI tools
    if (opts.mcp !== false) {
      const configured = configureMcp();
      if (configured.length > 0) {
        console.log(chalk.green(`✓ MCP configured for: ${configured.join(', ')}`));
        console.log(chalk.dim('  Restart your AI tool to activate AMP tools.'));
      } else {
        console.log(chalk.dim('  No AI tools detected. Run `amp-mcp` manually as MCP server.'));
      }
    }

    console.log(chalk.bold('\n  AMP is ready!'));
    console.log(chalk.dim('  Run `amp invite` to connect with someone.\n'));
  });

interface McpTarget {
  name: string;
  configPath: string;
  configKey: string;
  format: 'json' | 'json-nested';
}

function detectMcpTargets(): McpTarget[] {
  const home = homedir();
  const targets: McpTarget[] = [];

  // Claude Code
  const claudePath = join(home, '.claude.json');
  if (existsSync(claudePath) || existsSync(join(home, '.claude'))) {
    targets.push({ name: 'Claude Code', configPath: claudePath, configKey: 'mcpServers', format: 'json' });
  }

  // Cursor
  const cursorPath = join(home, '.cursor', 'mcp.json');
  if (existsSync(join(home, '.cursor'))) {
    targets.push({ name: 'Cursor', configPath: cursorPath, configKey: 'mcpServers', format: 'json' });
  }

  // Codex
  const codexPath = join(home, '.codex', 'config.toml');
  if (existsSync(codexPath)) {
    targets.push({ name: 'Codex', configPath: codexPath, configKey: 'mcpServers', format: 'json' });
  }

  // Windsurf / Codeium
  const windsurfPath = join(home, '.codeium', 'windsurf', 'mcp_config.json');
  if (existsSync(join(home, '.codeium'))) {
    targets.push({ name: 'Windsurf', configPath: windsurfPath, configKey: 'mcpServers', format: 'json' });
  }

  return targets;
}

function findAmpMcpBinary(): string {
  try {
    const { execSync } = require('node:child_process');
    return execSync('which amp-mcp', { encoding: 'utf-8' }).trim();
  } catch {
    return 'amp-mcp';
  }
}

function configureMcp(): string[] {
  const targets = detectMcpTargets();
  const ampMcpPath = findAmpMcpBinary();
  const configured: string[] = [];

  for (const target of targets) {
    try {
      let config: Record<string, unknown> = {};
      if (existsSync(target.configPath)) {
        config = JSON.parse(readFileSync(target.configPath, 'utf-8'));
      }

      const servers = (config[target.configKey] ?? {}) as Record<string, unknown>;
      servers['amp'] = { command: ampMcpPath, args: [] };
      config[target.configKey] = servers;

      const dir = join(target.configPath, '..');
      if (!existsSync(dir)) {
        const { mkdirSync } = require('node:fs');
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(target.configPath, JSON.stringify(config, null, 2));
      configured.push(target.name);
    } catch {
      // skip silently
    }
  }

  return configured;
}

program
  .command('status')
  .description('Show node status')
  .action(() => {
    const identity = ensureIdentity();
    const fp = fingerprint(identity.publicKey);
    const stats = getInboxStats();
    const peers = listPeers();
    const online = peers.filter(p => {
      if (!p.lastSeen) return false;
      return Date.now() - new Date(p.lastSeen).getTime() < 60_000;
    });

    console.log(chalk.bold('\n  AMP Node'));
    console.log(`  ID:      ${chalk.cyan(fp)}`);
    console.log(`  Host:    ${hostname()}`);
    console.log();
    console.log(`  Peers:   ${chalk.green(online.length + ' online')} / ${peers.length} total`);
    console.log(`  Inbox:   ${stats.unread > 0 ? chalk.yellow(stats.unread + ' unread') : chalk.dim('empty')}`);
    console.log(`  Outbox:  ${stats.pendingOutbound > 0 ? chalk.yellow(stats.pendingOutbound + ' queued') : chalk.dim('empty')}`);
    console.log();
  });

program
  .command('invite')
  .description('Generate an invite code for a new peer')
  .action(() => {
    const identity = ensureIdentity();
    const addr = `${hostname()}:9800`;
    const name = hostname();
    const code = createInvite(identity, name, addr);
    const fp = fingerprint(identity.publicKey);

    console.log(chalk.bold('\n  Your invite code') + chalk.dim(' (expires in 15 min):\n'));
    console.log(`  ${chalk.cyan(code)}`);
    console.log(chalk.dim(`\n  Verification: ${fp.slice(0, 8)}`));
    console.log(chalk.dim('  Share via a secure channel (in person, WhatsApp, etc.)\n'));
  });

program
  .command('join <invite-code>')
  .description('Accept an invite and add peer')
  .action((inviteCode: string) => {
    try {
      const payload = parseInvite(inviteCode);
      const publicKey = decodeBase64(payload.pk);
      const signingKey = decodeBase64(payload.sk);

      console.log(chalk.bold('\n  New peer found:'));
      console.log(`  Name:        ${chalk.cyan(payload.name)}`);
      console.log(`  Fingerprint: ${chalk.yellow(payload.fp)}`);
      console.log(`  Address:     ${payload.addr}`);
      console.log();

      const alias = payload.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      addPeer(alias, publicKey, signingKey, payload.name);

      console.log(chalk.green(`  ✓ Peer added as "${alias}"`));
      console.log(chalk.dim('  Verify the fingerprint with the other person.\n'));
    } catch (err) {
      console.error(chalk.red(`  ✗ ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('peers')
  .description('List contacts')
  .action(() => {
    const peers = listPeers();
    if (peers.length === 0) {
      console.log(chalk.dim('\n  No peers yet. Run `amp invite` to connect with someone.\n'));
      return;
    }

    console.log(chalk.bold('\n  Peers:\n'));
    for (const p of peers) {
      const isOnline = p.lastSeen && Date.now() - new Date(p.lastSeen).getTime() < 60_000;
      const dot = isOnline ? chalk.green('●') : chalk.dim('○');
      const seen = p.lastSeen ? chalk.dim(` seen ${timeSince(new Date(p.lastSeen))}`) : '';
      console.log(`  ${dot} ${chalk.bold(p.alias)}${p.displayName ? chalk.dim(` (${p.displayName})`) : ''}${seen}`);
    }
    console.log();
  });

program
  .command('send <peer> <message>')
  .description('Send a message to a peer')
  .option('-f, --file <path>', 'Attach a file')
  .action((peer: string, message: string, opts: { file?: string }) => {
    const p = getPeer(peer);
    if (!p) {
      console.error(chalk.red(`  ✗ Peer "${peer}" not found. Run \`amp peers\` to see contacts.`));
      process.exit(1);
    }

    let filePath: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    if (opts.file) {
      const stat = statSync(opts.file);
      filePath = opts.file;
      fileName = basename(opts.file);
      fileSize = stat.size;
    }

    const id = queueOutbound(peer, message, filePath, fileName, fileSize);

    if (fileName) {
      console.log(`  ${chalk.green('✓')} Queued to ${chalk.bold(peer)}: "${message}" + ${chalk.dim(fileName)}`);
    } else {
      console.log(`  ${chalk.green('✓')} Queued to ${chalk.bold(peer)}: "${message}"`);
    }
  });

program
  .command('inbox')
  .description('Show inbox')
  .option('-a, --all', 'Show all messages, not just unread')
  .action((opts: { all?: boolean }) => {
    const messages = opts.all ? getAllInbox() : getUnreadInbox();

    if (messages.length === 0) {
      console.log(chalk.dim('\n  No messages.\n'));
      return;
    }

    console.log(chalk.bold(`\n  Inbox (${messages.length}):\n`));
    for (const msg of messages) {
      const icon = msg.fileName ? '📎' : '💬';
      const age = timeSince(new Date(msg.createdAt));
      const unread = msg.status !== 'read' ? chalk.yellow(' NEW') : '';
      console.log(`  #${msg.id.slice(0, 6)}  ${icon} ${chalk.bold(msg.fromPeer)}  ${chalk.dim(age)}${unread}`);
      console.log(`         ${msg.content ?? chalk.dim('(file only)')}`);
      if (msg.fileName) {
        console.log(`         ${chalk.dim(`📎 ${msg.fileName}`)}`);
      }
      console.log();
    }
  });

program
  .command('read <id>')
  .description('Read a specific message and mark as read')
  .action((id: string) => {
    const messages = getAllInbox();
    const msg = messages.find(m => m.id.startsWith(id));
    if (!msg) {
      console.error(chalk.red(`  ✗ Message not found`));
      process.exit(1);
    }

    markAsRead(msg.id);

    console.log();
    console.log(`  ${chalk.dim('From:')} ${chalk.bold(msg.fromPeer)}`);
    console.log(`  ${chalk.dim('Date:')} ${msg.createdAt}`);
    console.log(`  ${'─'.repeat(40)}`);
    console.log(`  ${msg.content ?? chalk.dim('(no text)')}`);
    if (msg.fileName) {
      console.log(`\n  ${chalk.dim(`📎 ${msg.fileName} (${formatBytes(msg.fileSize ?? 0)})`)}`);
    }
    console.log();
  });

program.parse();

closeDb();

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
