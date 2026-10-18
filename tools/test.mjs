// node tools/test.mjs — checks the data and plays whole games, checking the world stays consistent
import { newGame, step, citiesOf, gensOf } from '../js/sim/engine.js';
import { GENERALS_RAW } from '../js/data/generals.js';
import { CITIES } from '../js/data/world.js';

let fails = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

const lines = GENERALS_RAW.trim().split('\n');
ok('500 generals', lines.length === 500, String(lines.length));
ok('504 with the hidden four', newGame({ seed: 1 }).gens.length === 504);
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
// every scenario: lords alive, the world stays consistent, items and spells behave
import { SCENARIOS } from '../js/data/scenarios.js';
for (const S of SCENARIOS) {
  const G = newGame({ seed: 11, scenario: S.id });
  ok(`${S.id}: starts in ${S.year} with ${S.factions.length} warlords`, G.year === S.year && Object.values(G.factions).length === S.factions.length);
  let errs = [];
  while (!G.over && G.year < S.year + 60) {
    step(G);
    if (G.month === 1) {
      errs = errs.concat(consistent(G));
      for (const it of G.items) { const n = (it.holder != null) + (it.fac != null) + (it.city != null); if (n > 1) errs.push(`${it.zh} in two places`); if (it.holder != null && !['serving', 'free'].includes(G.gens[it.holder].status)) errs.push(`${it.zh} held by ${G.gens[it.holder].status} ${G.gens[it.holder].name}`); }
      for (const g of G.gens) for (const k of ['lead', 'war', 'int', 'pol', 'cha']) { const want = g.base[k] + G.items.filter((it) => it.holder === g.id).reduce((s2, it) => s2 + (it.fx[k] || 0), 0); if (g[k] !== want) errs.push(`${g.name}.${k} ${g[k]} != ${want}`); }
    }
    if (errs.length) break;
  }
  ok(`${S.id}: consistent for 60 years (or to the end)`, !errs.length, errs.slice(0, 3).join('; '));
  ok(`${S.id}: random events happen`, G.log.filter((e) => e.kind === 'event').length > 50);
}
const sc208 = newGame({ seed: 3, scenario: '208' });
ok('208: Zhuge Liang serves Liu Bei, Sima Yi serves Cao Cao', sc208.byName['諸葛亮'].fac === 'liubei' && sc208.byName['司馬懿'].fac === 'cao');
ok('208: Sun Quan and Liu Bei are allied', sc208.factions.sun.allies.liubei > 0);
ok('221: Cao Pi rules Wei', sc208 && newGame({ seed: 3, scenario: '221' }).factions.cao.name === '曹丕');
ok('Guan Yu carries the Green Dragon blade in 190', (() => { const g = newGame({ seed: 4 }); return g.items.find((i) => i.key === 'qinglong').holder === g.byName['關羽'].id && g.byName['關羽'].war === g.byName['關羽'].base.war + 5; })());
ok('Zhuge Liang knows the Eight-Gate Maze', newGame({ seed: 4, scenario: '208' }).byName['諸葛亮'].spells.includes('zhen'));
{ let seen = 0; for (let sd = 1; sd <= 12; sd++) { const g = newGame({ seed: sd }); for (let i = 0; i < 12 * 40 && !g.over; i++) step(g); seen += g.gens.filter((x) => x.hidden && x.status !== 'unborn').length; }
  ok('the hidden generals turn up in some games', seen > 0, `${seen} appearances in 12 games`); }
const a = newGame({ seed: 99 }), b = newGame({ seed: 99 });
for (let i = 0; i < 240; i++) { step(a); step(b); }
ok('the same seed plays the same history', a.log.length === b.log.length && a.log.at(-1).text === b.log.at(-1).text);
console.log(fails ? `test: ${fails} failed` : 'test: all passed');
process.exit(fails ? 1 : 0);
