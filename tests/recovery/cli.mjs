import fs from 'node:fs';
import path from 'node:path';
import P from './profile.cjs';
import processes from './processes.cjs';
import state from './state.cjs';

// IDs are owned profile basenames, never arbitrary filesystem paths. No crash command exists.
export async function main(args) {
  const [command, option, id] = args;
  if (command === 'smoke' && args.length === 1) return { pass: true, scenarios: await (await import('./desktop.mjs')).smoke() };
  if (args.length !== 3 || option !== '--scenario') throw new Error('INVALID_COMMAND');
  if (command === 'prepare') {
    const p = P.create(id); processes.noNotepad(p); await state.seed(p);
    return { scenario: p.scenario, profile: p.id, classification: p.scenario === 'B' ? 'preparation_required' : 'seeded', counts: P.counts(p), pass: true };
  }
  const p = P.load(id);
  if (command === 'launch') {
    const phase = p.scenario === 'B' && P.counts(p).preparationFakeProviderCalls === 0 ? 'preparation' : 'recovery';
    const running = await (await import('./desktop.mjs')).launch(p, phase);
    console.log(JSON.stringify({ scenario: p.scenario, profile: p.id, classification: phase, counts: P.validateZero(p), pass: true }));
    // Keep the test driver attached. The user exits via Jarvis. No approval clicks or kill.
    await new Promise(resolve => running.app.process().once('exit', resolve));
    await running.app.close();
    // A launch lock is released only after captured processes have disappeared.
    const lock = path.join(p.control, 'launch.lock');
    if (fs.existsSync(lock)) fs.unlinkSync(P.canonical(lock));
    if (!processes.inactive(p)) { fs.writeFileSync(lock, p.nonce, { flag: 'wx' }); throw new Error('PROCESS_REMAINS'); }
    return { scenario: p.scenario, classification: 'exited', counts: P.validateZero(p), pass: true };
  }
  if (command === 'inspect') return { scenario: p.scenario, profile: p.id, classification: processes.inactive(p) ? (await state.inspect(p)).classification : 'active_or_uncertain', counts: P.counts(p), pass: true };
  if (command === 'resolve-crash-targets') {
    const targets = processes.resolve(p);
    return { scenario: p.scenario, profile: p.id, classification: 'verified_targets_no_termination', processes: Object.fromEntries(['desktop_main', 'core_host', 'renderer', 'utility'].map(role => [role, targets.filter(t => t.role === role).length])), pass: true };
  }
  if (command === 'cleanup') { P.remove(p, processes.inactive); return { scenario: p.scenario, classification: 'owned_profile_removed', pass: true }; }
  throw new Error('INVALID_COMMAND');
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main(process.argv.slice(2)).then(result => console.log(JSON.stringify(result))).catch(() => {
    console.log(JSON.stringify({ classification: 'harness_failed_closed', pass: false })); process.exitCode = 1;
  });
}
