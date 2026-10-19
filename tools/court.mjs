// node tools/court.mjs [games] — play warlords through the court (approve all / smart / reject all) and check that it works and how they fare
import { newGame, step, citiesOf, decide, autoDecide } from '../js/sim/engine.js';
import { proposalText, decisionText } from '../js/sim/text.js';

const games = +(process.argv[2] || 3);
let fails = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

function play(seed, player, how, years = 60) {
  const G = newGame({ seed, player }); G.auto.mode = how === 'reject' ? 'manual' : how; G.auto.askWar = false;
  const kinds = {}; let decided = 0, texts = 0, bad = '';
  while (!G.over && G.year < G.start + years) {
    step(G);
    for (const p of G.pending) { kinds[p.type] = (kinds[p.type] || 0) + 1; const [title, say] = proposalText(p, 'zh'); const [t2] = proposalText(p, 'en'); if (!title || !say || !t2 || /undefined|NaN/.test(title + say + t2)) bad = bad || `${p.type}: ${title} / ${say} / ${t2}`; }
    const res = how === 'reject' ? G.pending.splice(0).map(() => null) : autoDecide(G);
    if (how === 'reject') { /* left to lapse */ }
    for (const r of res) if (r) { decided++; const s = decisionText(r, 'zh') + decisionText(r, 'en'); if (/undefined|NaN/.test(s)) bad = bad || s; texts++; }
    if (how !== 'reject' && G.pending.length) bad = bad || 'pending left after auto-decide';
  }
  return { G, kinds, decided, bad, cities: citiesOf(G, player).length, alive: G.factions[player].alive };
}
for (const [player, sc] of [['cao', '190'], ['liubei', '190'], ['sun', '190']]) {
  for (const how of ['all', 'smart', 'reject']) {
    const out = [];
    for (let i = 0; i < games; i++) {
      const r = play(100 + i, player, how);
      if (r.bad) ok(`${player} ${how}: proposal text`, false, r.bad);
      out.push(`${r.G.over === player ? 'WON' : r.alive ? r.cities + ' cities' : 'fell'}@${r.G.year}`);
      if (i === 0) ok(`${player} ${how}: proposals of every kind come up`, ['job', 'war'].every((k) => r.kinds[k] || how === 'reject'), JSON.stringify(r.kinds));
    }
    console.log(`     ${player} (${sc}) ${how}: ${out.join(', ')}`);
  }
}
// manual answers: approve, reject and execute, one by one
{
  const G = newGame({ seed: 5, player: 'cao' }); let n = 0, ex = 0;
  for (let m = 0; m < 240 && !G.over; m++) { step(G); while (G.pending.length) { const p = G.pending[0]; if (p.type === 'captive' && ex < 2) { decide(G, false, 'execute'); ex++; } else decide(G, n++ % 3 !== 0); } }
  ok('manual decisions (approve, reject, execute) keep the world going', G.year > 200 && G.decided.length > 0, `${G.year} executed ${ex}`);
}
// watching (no player) is unchanged: no proposals at all
{ const G = newGame({ seed: 3 }); for (let m = 0; m < 60; m++) step(G); ok('watch mode makes no proposals', G.pending.length === 0 && G.decided.length === 0); }
console.log(fails ? `${fails} FAILED` : 'court: all passed');
process.exit(fails ? 1 : 0);
