// Run whole games headless and print what happened:  node tools/sim.mjs [games] [seed]
import { newGame, step, citiesOf, gensOf } from '../js/sim/engine.js';
import { fmt, dateStr } from '../js/sim/text.js';

const games = +(process.argv[2] || 5), seed0 = +(process.argv[3] || 1);
const results = [];
for (let k = 0; k < games; k++) {
  const G = newGame({ seed: seed0 + k });
  const t0 = Date.now();
  while (!G.over) step(G);
  const winner = G.factions[G.over], counts = {};
  for (const e of G.log) counts[e.kind] = (counts[e.kind] || 0) + 1;
  results.push({ seed: G.seed, year: G.year, winner: winner ? `${winner.name}（${G.gens[winner.lord].name}）` : G.over, ms: Date.now() - t0, counts });
  if (k === 0) {
    console.log('--- chronicle of seed', G.seed, '(major events)');
    for (const e of G.log.filter((x) => x.level >= 3)) console.log(dateStr(e.year, e.month, 'zh'), fmt(e, 'zh'), '|', fmt(e, 'en'));
    for (const y of [195, 200, 210, 220, 230]) { const h = G.history.find((s) => s.year === y); if (h) console.log(y, Object.entries(h.f).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, n]) => `${G.factions[f].name}${n}`).join(' ')); }
  }
}
for (const r of results) console.log(r.seed, r.year, r.winner, `${r.ms}ms`, JSON.stringify(r.counts));
