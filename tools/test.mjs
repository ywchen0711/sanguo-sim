// node tools/test.mjs — checks the data and plays whole games, checking the world stays consistent
import { newGame, step, citiesOf, gensOf } from '../js/sim/engine.js';
import { GENERALS_RAW } from '../js/data/generals.js';
import { CITIES } from '../js/data/world.js';

let fails = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

const lines = GENERALS_RAW.trim().split('\n');
ok('500 generals', lines.length === 500, String(lines.length));
const names = lines.map((l) => l.split(',')[0]);
ok('names are unique', new Set(names).size === names.length);
ok('stats are 1-100', lines.every((l) => l.split(',').slice(3, 8).every((v) => +v >= 1 && +v <= 100)));
ok('born before died', lines.every((l) => +l.split(',')[1] < +l.split(',')[2]));
ok('45 cities', CITIES.length === 45);

const G0 = newGame({ seed: 7 });
ok('roads go both ways', G0.cities.every((c) => c.adj.every((a) => G0.cities[a].adj.includes(c.id))));
ok('every city is reachable', (() => { const seen = new Set([0]), q = [0]; while (q.length) for (const a of G0.cities[q.shift()].adj) if (!seen.has(a)) { seen.add(a); q.push(a); } return seen.size === 45; })());
ok('every warlord starts as a serving lord', Object.values(G0.factions).every((f) => G0.gens[f.lord].status === 'serving' && G0.gens[f.lord].fac === f.id));
ok('諸葛亮 has not come of age in 190', G0.byName['諸葛亮'].status === 'unborn');
ok('關羽 serves 劉備 in 190', G0.byName['關羽'].fac === 'liubei');

function consistent(G) {
  const errs = [];
  for (const c of G.cities) {
    for (const k of ['pop', 'troops', 'farm', 'comm', 'def', 'train', 'morale']) if (!Number.isFinite(c[k]) || c[k] < 0) errs.push(`${c.name}.${k}=${c[k]}`);
    if (c.owner && !G.factions[c.owner].alive) errs.push(`${c.name} owned by dead faction ${c.owner}`);
  }
  for (const f of Object.values(G.factions)) if (f.alive) {
    const lord = G.gens[f.lord];
    if (lord.status !== 'serving' || lord.fac !== f.id) errs.push(`${f.name}: lord ${lord.name} is ${lord.status}/${lord.fac}`);
    if (!Number.isFinite(f.gold) || !Number.isFinite(f.food)) errs.push(`${f.name} gold/food`);
  }
  for (const g of G.gens) if (g.status === 'serving' && (!G.factions[g.fac] || !G.factions[g.fac].alive)) errs.push(`${g.name} serves dead faction ${g.fac}`);
  return errs;
}
for (const seed of [1, 2, 3]) {
  const G = newGame({ seed }); let errs = [];
  while (!G.over) { step(G); if (G.month === 1) errs = errs.concat(consistent(G)); if (errs.length) break; }
  ok(`seed ${seed}: the world stays consistent to the end (${G.year})`, !errs.length, errs.slice(0, 3).join('; '));
  ok(`seed ${seed}: generals come of age, serve and die`, G.gens.some((g) => g.born > 190 && g.status === 'dead') && G.log.some((e) => e.kind === 'join'));
  ok(`seed ${seed}: wars, duels and diplomacy happen`, ['war', 'duel', 'diplo'].every((k) => G.log.some((e) => e.kind === k)));
  if (G.over !== 'time') ok(`seed ${seed}: the winner holds every city`, G.cities.every((c) => c.owner === G.over));
}
const a = newGame({ seed: 99 }), b = newGame({ seed: 99 });
for (let i = 0; i < 240; i++) { step(a); step(b); }
ok('the same seed plays the same history', a.log.length === b.log.length && a.log.at(-1).text === b.log.at(-1).text);
console.log(fails ? `test: ${fails} failed` : 'test: all passed');
process.exit(fails ? 1 : 0);
