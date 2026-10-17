// How fast does the map consolidate?  node tools/balance.mjs [games] [seed]
import { newGame, step, citiesOf } from '../js/sim/engine.js';
const games = +(process.argv[2] || 6), seed0 = +(process.argv[3] || 1), years = [195, 200, 210, 220, 240, 260, 280];
const ends = [];
for (let k = 0; k < games; k++) {
  const G = newGame({ seed: seed0 + k }), row = [];
  while (!G.over) {
    step(G);
    if (G.month === 1 && years.includes(G.year)) {
      const alive = Object.values(G.factions).filter((f) => f.alive).map((f) => citiesOf(G, f.id).length).sort((a, b) => b - a);
      row.push(`${G.year}:${alive.slice(0, 3).join('/')}(${alive.length})`);
    }
  }
  const wars = G.log.filter((e) => e.kind === 'war'), wins = wars.filter((e) => e.win).length;
  ends.push(G.over === 'time' ? 300 : G.year);
  console.log(G.seed, G.over === 'time' ? 'no winner' : G.year, `wars ${wars.length} won ${wins}`, row.join(' '));
}
console.log('unification years:', ends.sort((a, b) => a - b).join(' '));
