// TEST ONLY stand-in for Desktop Main supervision. No product imports.
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
let live = 0;
export const liveSearchWorkers = () => live;
const worker = fileURLToPath(new URL('./worker.mjs', import.meta.url));
export function startSearch(input, onCheckpoint = () => {}) {
  if (live !== 0) throw new Error('SEARCH_ALREADY_ACTIVE');
  live++;
  let child, cancelReason, staged, terminalCounts, workerArchitecture = "unknown", forced = false, closed = false, timer, grace;
  const exited = new Promise(resolve => {
    function cancel(reason = 'cancelled') {
      if (closed || cancelReason) return;
      cancelReason = reason; staged = undefined;
      if (child.connected) child.send({ kind: 'cancel' }, () => {});
      grace = setTimeout(() => { if (!closed) { forced = true; child.kill('SIGKILL'); } }, 100);
    }
    child = fork(worker, [], {
      cwd: input.fixtureBase,
      execArgv: ['--experimental-permission', `--allow-fs-read=${worker}`, `--allow-fs-read=${input.fixtureBase}`, '--no-experimental-fetch'],
      env: { SystemRoot: process.env.SystemRoot ?? '', TEMP: input.fixtureBase, TMP: input.fixtureBase },
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true,
    });
    child.on('error', () => { cancelReason = 'internal_unavailable'; });
    child.on('message', message => {
      if (message?.kind === 'ready') workerArchitecture = message.category === 'arch_arm64' ? 'arm64' : message.category === 'arch_x64' ? 'x64' : 'unknown';
      if (message?.kind === 'result' && message.counts?.openDirectories === 0) terminalCounts = message.counts;
      if (message?.kind === 'checkpoint' && !cancelReason) {
        Promise.resolve(onCheckpoint(message, { cancel, continue: () => { if (child.connected) child.send({ kind: 'continue' }, () => {}); } })).catch(() => cancel('internal_unavailable'));
      }
      if (message?.kind === 'result' && !cancelReason) staged = message;
    });
    // close follows process exit and stdio closure; no timeout resolves this promise.
    child.once('close', code => {
      closed = true; live--; clearTimeout(timer); clearTimeout(grace);
      const raw = !cancelReason && code === 0 ? staged : undefined;
      const category = cancelReason ?? raw?.category ?? 'worker_failed';
      const matches = category === 'completed' && Array.isArray(raw?.matches) ? raw.matches : undefined;
      const result = { category, workerExited: true, workerArchitecture, forced, activeWorkers: live,
        ...((raw?.counts ?? terminalCounts) ? { counts: raw?.counts ?? terminalCounts } : {}),
        ...(matches ? { matches, truncated: raw.truncated === true } : {}) };
      const safe = JSON.stringify(result);
      resolve(Buffer.byteLength(safe) <= 16384 ? result : { category: 'payload_rejected', workerExited: true, forced, activeWorkers: live });
    });
    timer = setTimeout(() => cancel('timed_out'), 3000);
    child.send({ kind: 'start', ...input }, () => {});
  });
  return exited;
}
