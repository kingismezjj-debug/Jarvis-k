// Only the external test launcher loads this module. There is no product crash hook.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
let setupStage = 'profile';
try {
const P = require('./profile.cjs');
const p = P.load(process.env.JARVIS_RECOVERY_TEST_ID);
// A fixture setup error must quit cleanly rather than leave Electron's error dialog open.
setupStage = 'guards';
function setupFailed(error) {
  P.atomic(path.join(p.control, 'bootstrap-failure.json'), require('./diagnostics.cjs').failure(
    setupStage === 'profile' ? 'profile_ownership' : 'desktop_start', 'launch').failure);
  if (process.type === 'browser') require('electron').app.quit();
}
process.on('uncaughtException', setupFailed);
process.on('unhandledRejection', setupFailed);
const phase = process.env.JARVIS_RECOVERY_TEST_PHASE;
assert.ok(['preparation', 'recovery'].includes(phase));
for (const [key, expected] of Object.entries({ JARVIS_K_USER_DATA_PATH: p.userData, JARVIS_K_LOCAL_DATA_PATH: p.localData, TEMP: p.temp, TMP: p.temp })) assert.equal(P.canonical(process.env[key]), expected);
assert.equal(P.canonical(os.tmpdir()), p.temp);
function forbidden(kind, port = 'unknown') {
  return require('./guards.cjs').rejectCall(p, phase, kind, port, process.type === 'browser' ? 'desktop_main' : 'core_host');
}
// No endpoint, authentication material, or network fallback is held by this fixture.
globalThis.fetch = () => forbidden('provider');
for (const name of ['node:http', 'node:https']) {
  const m = require(name); m.request = m.get = () => forbidden('provider');
}
require('node:net').connect = require('node:net').createConnection = () => forbidden('provider');
require('node:tls').connect = () => forbidden('provider');
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync']) cp[name] = () => forbidden('executor', name);
const originalFork = cp.fork;
cp.fork = (entry, args, options) => {
  assert.equal(path.resolve(entry), path.join(P.REPO, 'apps/core-host/dist/index.js'));
  return originalFork(entry, [...(args || []), `--jarvis-recovery-nonce=${p.nonce}`], { ...options, execArgv: ['--require', __filename] });
};
if (process.type === 'browser') {
  setupStage = 'desktop_guards';
  const electron = require('electron');
  assert.equal(electron.app.isPackaged, false);
  // Windows Known Folder lookup can reject a deliberately synthetic USERPROFILE.
  // Bind Electron's fallback paths explicitly before product storage-profile creation.
  electron.app.setPath('appData', p.userData);
  electron.app.setPath('temp', p.temp);
  electron.app.setPath('sessionData', p.userData);
  electron.shell.openExternal = electron.shell.openPath = () => forbidden('executor');
  // Guard all URLSession requests independently of the Node fetch guard.
  electron.app.whenReady().then(() => {
    electron.net.fetch = electron.net.request = () => forbidden('provider');
    electron.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (/^(https?|wss?):/i.test(details.url)) { try { forbidden('provider'); } catch { callback({ cancel: true }); } }
    else callback({});
    });
  });
  require('../../apps/desktop/dist/bounded-notepad-action.js').launchBoundedNotepad = () => forbidden('executor');
  setupStage = 'desktop_entry';
  require('../../apps/desktop/dist/main.js');
} else {
  setupStage = 'core_guards';
  P.atomic(path.join(p.control, 'core-attestation.json'), { pid: process.pid, parent: process.ppid, nonce: p.nonce, phase });
  const { CoreRuntime } = require('@jarvis-k/core');
  // Startup hardware probing normally invokes PowerShell. Supply a synthetic device
  // at that existing provider port instead; no probe process is allowed in this test.
  const { NodeDeviceCapabilityProvider } = require('../../apps/core-host/dist/node-device-capability-provider.js');
  NodeDeviceCapabilityProvider.prototype.inspect = async () => require('@jarvis-k/capabilities').buildCapabilitySnapshot({
    checkedAt: new Date().toISOString(), device: require('@jarvis-k/contracts').DeviceCapabilitySchema.parse({
      checkedAt: new Date().toISOString(), platform: 'win32', arch: 'x64', cpuLogicalCores: 2,
      totalMemoryBytes: 8589934592, availableMemoryBytes: 4294967296, gpus: [], accelerationBackends: ['cpu'],
      recommendedMode: 'lite', reasons: ['Synthetic recovery device'],
    }),
  });
  const { BrainActionAllowlistAdapter } = require('../../apps/core-host/dist/brain-action-allowlist-adapter.js');
  for (const name of ['openLocalApp', 'openBrowser', 'searchFilesystem', 'writeNotepadText', 'controlKnownAppWindow']) {
    BrainActionAllowlistAdapter.prototype[name] = () => forbidden('executor');
  }
  const { provider, input } = require('./provider.cjs');
  const fake = provider(p, phase);
  const configure = CoreRuntime.prototype.configureChatAnswerProductMode;
  CoreRuntime.prototype.configureChatAnswerProductMode = function () {
    configure.call(this, { provider: fake, options: { enabled: true, providerId: 'chat-answer.recovery-test' } });
  };
  const recover = CoreRuntime.prototype.hydrateAssistantTurns;
  CoreRuntime.prototype.hydrateAssistantTurns = async function () {
    this.configureChatAnswerProductMode();
    if (phase === 'recovery') P.count(p, 'recoveryRuns');
    await recover.call(this);
    P.atomic(path.join(p.control, 'recovery-ready.json'), { phase, blocked: this.getSnapshot().assistantRecoveryBlocked });
  };
  const ready = CoreRuntime.prototype.announceReady;
  let prepared = false;
  CoreRuntime.prototype.announceReady = function () {
    ready.call(this);
    if (phase === 'preparation') {
      assert.equal(p.scenario, 'B'); assert.equal(prepared, false); prepared = true;
      assert.equal(this.getSnapshot().assistantRecoveryBlocked, false);
      this.configureChatAnswerProductMode();
      // Test calls the existing turn port. Only the fake provider constructs the proposal.
      this.assistantRuntime.startTextTurn(input());
    }
  };
}
} catch (error) {
  console.error(JSON.stringify(require('./diagnostics.cjs').failure(
    setupStage === 'profile' ? 'profile_ownership' : 'desktop_start', 'launch').failure));
  // Includes failures before profile loading: do not leave an Electron error dialog.
  if (process.type === 'browser') require('electron').app.quit();
  else process.exitCode = 1;
}
