// Deliberately separate: normal scenarios must always use validated repository append.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const P = require('./profile.cjs');
exports.corrupt = async p => {
  p = P.load(p.id); assert.equal(p.scenario, 'F');
  assert.ok(!fs.existsSync(path.join(p.control, 'ever-launched')), 'CORRUPTION_REQUIRES_OFFLINE_NEW_PROFILE');
  const file = P.canonical(path.join(p.localData, 'task-runtime.sqlite'));
  const SQL = await require('sql.js')(); const db = new SQL.Database(fs.readFileSync(file));
  try {
    db.run('DROP TRIGGER assistant_events_no_update');
    db.run("UPDATE assistant_turn_events SET sequence=7 WHERE turn_id='synthetic-turn' AND sequence=1");
    db.run("CREATE TRIGGER assistant_events_no_update BEFORE UPDATE ON assistant_turn_events BEGIN SELECT RAISE(ABORT, 'append only'); END");
    fs.writeFileSync(file, db.export());
  } finally { db.close(); }
};
