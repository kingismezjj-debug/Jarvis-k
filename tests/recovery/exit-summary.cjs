// Safe test-only process summaries; no raw process identity is serializable here.
const ROLES = Object.freeze(['desktop_main', 'core_host', 'renderer', 'utility']);
const IDENTITIES = Object.freeze(['matching_identity_active', 'pid_reused_identity_mismatch',
  'child_of_matching_identity_active', 'identity_unavailable', 'no_matching_process']);
const TIMEOUTS = Object.freeze(['none', 'deadline_exceeded', 'query_timeout', 'query_error', 'query_cancelled']);
const keys = ['roleCounts', 'identityCounts', 'launchExitObserved', 'stableSampleCount', 'queryAttempts', 'timeoutClassification', 'notepadCount'];
const count = n => Number.isInteger(n) && n >= 0 && n <= 4096;
function exact(o, fields) { return o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join('|') === [...fields].sort().join('|'); }
function counts(o, fields) { return exact(o, fields) && Object.values(o).every(count); }
function valid(s) {
  return exact(s, keys) && counts(s.roleCounts, ROLES) && counts(s.identityCounts, IDENTITIES) &&
    typeof s.launchExitObserved === 'boolean' && count(s.stableSampleCount) && s.stableSampleCount <= 3 &&
    count(s.queryAttempts) && TIMEOUTS.includes(s.timeoutClassification) && count(s.notepadCount);
}
function empty() { return { roleCounts: Object.fromEntries(ROLES.map(k => [k,0])),
  identityCounts: Object.fromEntries(IDENTITIES.map(k => [k,0])), launchExitObserved: false,
  stableSampleCount: 0, queryAttempts: 0, timeoutClassification: 'none', notepadCount: 0 }; }
module.exports = { ROLES, IDENTITIES, TIMEOUTS, keys, exact, valid, empty };
