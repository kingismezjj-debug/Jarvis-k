import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scratch: string[] = [];
afterEach(() => { for (const dir of scratch.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

// Exercise npm's real lifecycle and the repository's real orchestration strings.
// Only leaf compilers and executables are replaced; no Electron, provider, network,
// Windows action, recovery profile or application data is used by this fixture.
function fixture(failStage = '') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-build-order-'));
  scratch.push(dir);
  const scripts = { ...manifest.scripts };
  for (const name of Object.keys(scripts)) {
    if (name.startsWith('build:')) scripts[name] = `node runner.cjs ${name}`;
  }
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'offline-build-order', private: true, scripts }));
  fs.writeFileSync(path.join(dir, 'runner.cjs'), `
const fs = require('node:fs');
const stage = process.argv[2];
fs.appendFileSync('order.txt', stage + '\\n');
if (stage === ${JSON.stringify(failStage)}) { console.error('BUILD_ORDER_FIXTURE_FAILURE ' + stage); process.exit(17); }
if (stage === 'build:desktop') {
  fs.mkdirSync('apps/desktop/dist', {recursive:true});
  fs.writeFileSync('apps/desktop/dist/secure-chat-answer-provider-store.js', 'fixture');
}
if (stage === 'vitest' || stage === 'electron') {
  if (!fs.existsSync('apps/desktop/dist/secure-chat-answer-provider-store.js')) {
    console.error('MISSING_DESKTOP_BUILD'); process.exit(18);
  }
}
`);
  const bin = path.join(dir, 'node_modules', '.bin');
  fs.mkdirSync(bin, { recursive: true });
  for (const name of ['electron', 'vitest']) {
    fs.writeFileSync(path.join(bin, name + '.cmd'), `@echo off\r\nnode "%~dp0../../runner.cjs" ${name}\r\n`);
    fs.writeFileSync(path.join(bin, name), `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/../../runner.cjs" ${name}\n`, { mode: 0o755 });
  }
  return dir;
}

function run(dir: string, entry: string) {
  const cli = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const env: NodeJS.ProcessEnv = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'COMSPEC', 'PATHEXT', 'HOME', 'USERPROFILE', 'TEMP', 'TMP']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  env.npm_config_cache = path.join(dir, '.npm-cache');
  env.npm_config_userconfig = path.join(dir, '.npmrc');
  env.npm_config_globalconfig = path.join(dir, '.global-npmrc');
  env.npm_config_update_notifier = 'false';
  env.npm_config_audit = 'false';
  env.npm_config_offline = 'true';
  execFileSync(process.execPath, [cli, 'run', entry], { cwd: dir, env, stdio: 'pipe', timeout: 110_000 });
  return fs.readFileSync(path.join(dir, 'order.txt'), 'utf8').trim().split('\n');
}

describe('clean development orchestration (inert executables)', () => {
  it('npm test creates the Desktop artifact before the test runner, without a manual build', () => {
    const dir = fixture();
    expect(fs.existsSync(path.join(dir, 'apps/desktop/dist'))).toBe(false);
    const order = run(dir, 'test');
    expect(order.indexOf('build:core-host')).toBeLessThan(order.indexOf('build:desktop'));
    expect(order.indexOf('build:desktop')).toBeGreaterThan(-1);
    expect(order.at(-1)).toBe('vitest');
  }, 120_000);

  it.each(['start', 'dev'])('%s builds all workspaces once before Electron', entry => {
    const order = run(fixture(), entry);
    const builds = order.filter(stage => stage.startsWith('build:'));
    expect(new Set(builds).size).toBe(manifest.workspaces.length);
    expect(builds.length).toBe(manifest.workspaces.length);
    expect(order.at(-1)).toBe('electron');
    const workspaceStage = new Map<string, string>();
    for (const workspace of manifest.workspaces) {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, workspace, 'package.json'), 'utf8'));
      const stage = Object.keys(manifest.scripts).find(key => manifest.scripts[key] === `npm run build -w ${pkg.name}`);
      expect(stage, `missing existing build entry for ${pkg.name}`).toBeTruthy();
      workspaceStage.set(pkg.name, stage!);
    }
    for (const workspace of manifest.workspaces) {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, workspace, 'package.json'), 'utf8'));
      for (const dependency of Object.keys(pkg.dependencies ?? {})) {
        if (workspaceStage.has(dependency)) {
          expect(order.indexOf(workspaceStage.get(dependency)!)).toBeLessThan(order.indexOf(workspaceStage.get(pkg.name)!));
        }
      }
    }
  }, 120_000);

  it.each(['start', 'test'])('%s stops on build failure without running the consumer', entry => {
    const dir = fixture('build:core');
    expect(() => run(dir, entry)).toThrow(/BUILD_ORDER_FIXTURE_FAILURE/);
    const order = fs.readFileSync(path.join(dir, 'order.txt'), 'utf8');
    expect(order).not.toMatch(/^(electron|vitest)$/m);
    expect(order).not.toContain('build:desktop');
  }, 120_000);
});

describe('current status and historical evidence separation', () => {
  it('keeps release/platform/recovery limits in the current summary and resolves evidence links', () => {
    const text = fs.readFileSync(path.join(root, 'CURRENT_STATUS.md'), 'utf8');
    expect(text).toContain(`\`${manifest.version}\``);
    for (const required of ['## Current product state', '## Historical evidence', '## Known limitations',
      'UI-3K-2E remains L3', 'Pending-approval real crash scenario B is not completed',
      'not been repackaged or signed', 'development validation only', 'one tool / one iteration',
      'not integrated into the new Assistant loop', 'External distribution: **NO**']) {
      expect(text.replaceAll('**', ''), required).toContain(required.replaceAll('**', ''));
    }
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      expect(fs.existsSync(path.resolve(root, match[1])), `missing evidence ${match[1]}`).toBe(true);
    }
    const current = text.split('## Historical evidence')[0];
    expect(current).not.toMatch(/No signing certificate|package remains unsigned|UI-3K-2E.*L4/);
  });

  it('makes entry points defer to the current summary and preserves both historical ledgers', () => {
    for (const file of ['README.md', 'docs/README.md', 'docs/developer-onboarding.md', 'docs/architecture.md',
      'docs/roadmaps/ui-modernization-roadmap.md', 'docs/roadmaps/oss-ui-integration-roadmap.md',
      'docs/jarvis-k-product-phase-roadmap-architecture-review-2026-08-11.md']) {
      expect(fs.readFileSync(path.join(root, file), 'utf8')).toContain('CURRENT_STATUS.md');
    }
    const old = fs.readFileSync(path.join(root, 'docs/history/current-status-before-ui-3l-0.md'), 'utf8');
    expect(old).toContain('No signing certificate');
    expect(old).toContain('## UI-3I-2C Status');
    expect(old).toContain('not current status');
    expect(fs.readFileSync(path.join(root, 'docs/history/readme-baselines-before-ui-3l-0.md'), 'utf8'))
      .toContain('Phase 12.3 Developer-Alpha Hardening');
  });
});
