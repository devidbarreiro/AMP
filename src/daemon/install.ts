import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

const PLIST_LABEL = 'com.amp.daemon';
const LAUNCH_AGENTS_DIR = join(homedir(), 'Library', 'LaunchAgents');
const PLIST_PATH = join(LAUNCH_AGENTS_DIR, `${PLIST_LABEL}.plist`);
const AMP_DIR = join(homedir(), '.amp');
const LOG_PATH = join(AMP_DIR, 'daemon.log');

export function installDaemon(): { installed: boolean; plistPath: string } {
  const nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
  const daemonScript = join(__dirname, '..', 'daemon', 'index.js');

  // If running from source (tsx), use the ts path
  const scriptPath = existsSync(daemonScript)
    ? daemonScript
    : join(__dirname, '..', 'daemon', 'index.ts');

  mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
  mkdirSync(AMP_DIR, { recursive: true, mode: 0o700 });

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${scriptPath}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_PATH}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_PATH}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AMP_PORT</key>
    <string>9800</string>
  </dict>
</dict>
</plist>`;

  writeFileSync(PLIST_PATH, plist);

  try {
    execSync(`launchctl unload ${PLIST_PATH} 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // may not be loaded yet
  }
  execSync(`launchctl load ${PLIST_PATH}`);

  return { installed: true, plistPath: PLIST_PATH };
}

export function uninstallDaemon(): void {
  try {
    execSync(`launchctl unload ${PLIST_PATH} 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // already unloaded
  }
  if (existsSync(PLIST_PATH)) {
    const { unlinkSync } = require('node:fs');
    unlinkSync(PLIST_PATH);
  }
}

export function isDaemonRunning(): boolean {
  try {
    const output = execSync(`launchctl list ${PLIST_LABEL} 2>/dev/null`, { encoding: 'utf-8' });
    return output.includes(PLIST_LABEL);
  } catch {
    return false;
  }
}
