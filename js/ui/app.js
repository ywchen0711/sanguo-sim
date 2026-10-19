// The page: runs the simulation month by month and shows the map, the chronicle, the warlords, the generals and the cities.
import { newGame, step, citiesOf, gensOf, power, capacity, heldBy, decide, autoDecide, autoAnswer } from '../sim/engine.js?v=3';
import { fmt, dateStr, nameIn, romanize, itemName, spellName, proposalText, decisionText, JOB } from '../sim/text.js?v=3';
import { SCENARIOS, SCEN } from '../data/scenarios.js';
import { makeView, drawMap, cityAt, drawChart, resetMap } from './map.js?v=3';

// ---------------------------------------------------------------- language
const q = new URLSearchParams(location.search);
let lang = q.get('lang') || (() => { try { return localStorage.getItem('sg_lang'); } catch (e) { return null; } })() || ((navigator.language || '').startsWith('zh') ? 'zh' : 'en');
if (lang !== 'zh' && lang !== 'en') lang = 'zh';
const T = {
  title: ['三國志', 'Three Kingdoms'], subtitle: ['群雄模擬', 'Chronicle'], play: ['▶ 開始', '▶ Play'], pause: ['⏸ 暫停', '⏸ Pause'], month: ['下個月', 'Next month'],
  year: ['跳一年', '+1 year'], newGame: ['新的天下', 'New game'], lang: ['English', '中文'], speed: ['速度', 'Speed'],
  chron: ['年表', 'Chronicle'], facs: ['勢力', 'Warlords'], gens: ['武將', 'Generals'], cities: ['城市', 'Cities'],
  major: ['重要', 'Major'], all: ['全部', 'All'], war: ['戰爭', 'War'], diplo: ['外交', 'Diplomacy'], people: ['人物', 'People'],
  lord: ['君主', 'Lord'], nCities: ['城', 'Cities'], nGens: ['武將', 'Generals'], troops: ['兵力', 'Troops'], gold: ['金', 'Gold'], food: ['糧', 'Food'],
  fallen: ['已滅亡的勢力', 'Fallen warlords'], allies: ['同盟', 'Allies'], truce: ['停戰', 'Truce'], capital: ['所在', 'Seat'], peak: ['最盛', 'Peak'],
  search: ['搜尋武將…', 'Search generals…'], anyStatus: ['所有狀態', 'Any status'], serving: ['在仕', 'Serving'], free: ['在野', 'Unaffiliated'], unborn: ['未登場', 'Not yet of age'], dead: ['已故', 'Dead'],
  anyFac: ['所有勢力', 'All warlords'], total: ['總和', 'Total'], name: ['名字', 'Name'], age: ['年齡', 'Age'],
  lead: ['統率', 'LEAD'], warS: ['武力', 'WAR'], int: ['智力', 'INT'], pol: ['政治', 'POL'], cha: ['魅力', 'CHA'],
  back: ['← 返回', '← Back'], born: ['生卒', 'Life'], status: ['狀態', 'Status'], faction: ['勢力', 'Warlord'], city: ['所在', 'Location'], loyalty: ['忠誠', 'Loyalty'],
  task: ['本月工作', 'This month'], merit: ['功績', 'Merit'], duels: ['一騎討勝', 'Duels won'], kills: ['斬將', 'Slain'], deeds: ['事蹟', 'Deeds'], none: ['（無）', '(none)'],
  owner: ['勢力', 'Held by'], gov: ['太守', 'Governor'], pop: ['人口', 'People'], farm: ['農業', 'Farming'], comm: ['商業', 'Commerce'], def: ['城防', 'Walls'],
  train: ['訓練', 'Training'], morale: ['民心', 'Morale'], here: ['駐守武將', 'Officers here'], wanderers: ['在野人才', 'Unaffiliated talent'], roads: ['相鄰城市', 'Roads to'],
  neutral: ['無主', 'Unclaimed'], start: ['開始模擬', 'Start'], seed: ['種子（同一個數字會重演同一段歷史）', 'Seed (the same number replays the same history)'],
  lifespan: ['壽命', 'Lifespans'], hist: ['史實', 'Historical'], long: ['延長（武將活得更久）', 'Longer (generals live longer)'],
  intro: ['公元一九〇年，董卓挾天子以令諸侯，關東群雄並起。五百名武將將在這片土地上各自登場、效忠、背叛、征戰與老去——這一次，天下會歸於誰？一切都會自動發生，你只需要看著歷史展開。',
    'AD 190. Dong Zhuo holds the emperor hostage, and warlords rise across the land. Five hundred generals will come of age, serve, betray, fight and grow old. Who will unite the realm this time? Everything happens on its own: just watch history unfold.'],
  unified: ['天下統一', 'The Realm United'], undecided: ['天下未定', 'The Realm Remains Divided'], keepWatching: ['繼續看年表', 'Keep reading'], years: ['年', 'years'],
  wars: ['場戰役', 'battles'], duelsN: ['次一騎討', 'duels'], fallenN: ['個勢力滅亡', 'warlords fell'], months: ['月', ''], ofAge: ['登場', 'comes of age'],
  scenario: ['劇本', 'Scenario'], events: ['事件', 'Events'], treasures: ['寶物', 'Items'], spells: ['法術', 'Spells'], gear: ['寶物', 'Treasures'],
  treasury: ['府庫中的寶物', 'In the treasury'], unknown: ['下落不明', 'Whereabouts unknown'], holder: ['持有', 'Held by'], hiddenGen: ['隱藏武將', 'Hidden general'],
  court: ['奏報', 'Court'], playAs: ['君主（你要扮演誰？）', 'Play as (which warlord do you rule?)'], watchOnly: ['不扮演，只看歷史自己展開', 'Nobody: just watch history unfold'],
  approve: ['✔ 准奏', '✔ Approve'], reject: ['✖ 駁回', '✖ Reject'], persuade: ['✔ 勸降', '✔ Win over'], releaseB: ['釋放', 'Release'], execute: ['處斬', 'Execute'],
  autoMode: ['自動回覆奏報', 'Answer proposals'], manual: ['手動：每份都問我', 'Manually: ask me'], smart: ['智能判斷', 'Smart: judge for me'], approveAll: ['全部准奏', 'Approve everything'],
  askWar: ['出征仍由我決定', 'Always ask me about attacks'], waiting: ['份奏報待處理', 'proposals waiting'], lastOne: ['這是本月最後一份奏報', 'The last proposal this month'],
  noPending: ['目前沒有待處理的奏報。按 ▶ 開始 或 下個月，武將們就會再來上奏。', 'No proposals waiting. Press ▶ Play or Next month and your officers will come with more.'],
  decided: ['最近的決定', 'Recent decisions'], you: ['你', 'You'], realmFell: ['你的勢力滅亡了', 'Your realm has fallen'], realmWon: ['你統一了天下！', 'You have united the realm!'],
  fellText: ['可以繼續觀看天下大勢，或開始新的天下。', 'You can keep watching how the realm unfolds, or start a new game.'], odds: ['勝算', 'Odds'], persuadeOdds: ['勸降成功率', 'Chance to win over'],
  withArmy: ['隨行', 'With'], loyaltyS: ['忠誠', 'loyalty'], from: ['出兵', 'From'], courtHint: ['武將上奏時遊戲會暫停，等你決定。', 'The game pauses while a proposal waits for you.'],
  slots: { w: ['武器', 'Weapon'], h: ['坐騎', 'Horse'], b: ['書籍', 'Book'], t: ['寶物', 'Treasure'] },
  tasks: { farm: ['開墾', 'Farming'], comm: ['商業', 'Commerce'], def: ['城防', 'Walls'], morale: ['巡察', 'Patrol'], train: ['訓練', 'Training'], draft: ['徵兵', 'Drafting'], reward: ['褒賞', 'Rewards'], search: ['搜索', 'Searching'], recruitGen: ['登用', 'Recruiting'] },
};
const t = (k) => (T[k] ? T[k][lang === 'en' ? 1 : 0] : k);
const N = (name) => nameIn(name, lang), CN = (name) => nameIn(name, lang, true);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const big = (n) => (lang === 'en' ? (n >= 10000 ? (n / 1000).toFixed(0) + 'k' : String(n)) : n >= 10000 ? (n / 10000).toFixed(1) + '萬' : String(n));
const $ = (s) => document.querySelector(s);

// ---------------------------------------------------------------- state
let G = null, speed = 0, acc = 0, dirty = true, autoSet = { mode: 'manual', askWar: true }, ui = { tab: 'chron', resume: false, flash: [], sel: null, gen: null, fac: null, filter: 'major', recentWars: [], gq: '', gstatus: 'serving', gfac: '', gsort: 'total' };
const SPEEDS = [1, 3, 8, 24, 60];       // months per second
let speedIx = 1;
function start(seed, lifespan, scenario, player) {
  G = newGame({ seed, lifespan, scenario, player }); G.auto = { ...autoSet }; resetMap(); ui = { ...ui, sel: null, gen: null, fac: null, recentWars: [], flash: [], resume: false, tab: G.player ? 'court' : ui.tab === 'court' ? 'chron' : ui.tab, fellShown: false }; speed = 0; dirty = true;
  const u = new URLSearchParams(location.search); u.set('seed', G.seed); u.set('sc', G.scenario); if (G.player) u.set('pl', G.player); else u.delete('pl'); history.replaceState(null, '', '?' + u);   // shareable: the same seed and scenario replay the same history
  render();
}

// ---------------------------------------------------------------- the loop
let last = performance.now(), paneT = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  if (G && speed && !G.over) {
    acc += dt * SPEEDS[speedIx];
    let n = 0; while (acc >= 1 && n < 10 && speed) { advance(); acc--; n++; }
    if (G.over) { speed = 0; showEnd(); }
  }
  drawAll();
  paneT += dt; if (dirty && paneT > 0.25) { paneT = 0; dirty = false; renderPane(); renderHeader(); }
  requestAnimationFrame(frame);
}
function advance() {
  const before = G.log.length;
  step(G);
  courtTurn(before);
  dirty = true;
}
// after each month: answer what the automatic setting allows; if a proposal still waits for the lord, stop and show it
function courtTurn(before) {
  if (G.player) { const done = autoDecide(G); if (done.length) ui.flash = ui.flash.concat(done).slice(-6); }
  for (const e of G.log.slice(before)) if (e.kind === 'war') ui.recentWars.push(e);
  ui.recentWars = ui.recentWars.filter((e) => G.t - e.t <= 4);
  if (G.player && G.pending.length) { if (speed) ui.resume = true; speed = 0; acc = 0; ui.tab = 'court'; ui.gen = null; ui.fac = null; renderControls(); renderTabs(); }
  if (G.player && !G.factions[G.player].alive && !ui.fellShown) { ui.fellShown = true; speed = 0; showFell(); }
}
// the lord answers the first proposal
function answer(yes, choice) {
  const before = G.log.length, r = decide(G, yes, choice); if (!r) return;
  ui.flash = ui.flash.concat([r]).slice(-6);
  ui.flash = ui.flash.concat(autoDecide(G)).slice(-6);
  for (const e of G.log.slice(before)) if (e.kind === 'war') ui.recentWars.push(e);
  if (G.over && !G.pending.length) { showEnd(); return; }
  if (!G.pending.length && ui.resume) { ui.resume = false; speed = 1; }
  renderControls(); renderHeader(); renderPane();
}

// ---------------------------------------------------------------- drawing
function fit(cv) { const r = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * r) || cv.height !== Math.round(h * r)) { cv.width = Math.round(w * r); cv.height = Math.round(h * r); } const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0); return c; }
let view = null;
function drawAll() {
  if (!G) return;
  const cv = $('#map'), c = fit(cv); view = makeView(cv);
  const pw = G.player && G.pending[0] && G.pending[0].type === 'war' ? G.pending[0] : null;
  ui.plan = pw ? { to: pw.target, from: pw.from, fac: G.player } : null;
  drawMap(c, G, view, ui, lang);
  const ch = $('#chart'), cc = fit(ch); drawChart(cc, G, ch.clientWidth, ch.clientHeight, lang);
}

// ---------------------------------------------------------------- header and controls
function renderHeader() {
  $('#title').textContent = t('title'); $('#subtitle').textContent = `${t('subtitle')} · ${SCEN[G.scenario].name[lang === 'en' ? 1 : 0]}`;
  const alive = Object.values(G.factions).filter((f) => f.alive).length;
  const me = G.player && G.factions[G.player], meTxt = me ? `<b style="color:${me.color}">${t('you')}: ${esc(N(me.name))}</b> · ` : '';
  $('#date').innerHTML = `${dateStr(G.year, G.month, lang)}<small>${meTxt}${lang === 'en' ? `${alive} warlords · seed ${G.seed}` : `群雄 ${alive} · 種子 ${G.seed}`}</small>`;
  const legend = Object.values(G.factions).filter((f) => f.alive).map((f) => [f, citiesOf(G, f.id).length]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $('#legend').innerHTML = legend.map(([f, n]) => `<div><i style="background:${f.color}"></i>${esc(N(f.name))} ${n}</div>`).join('');
}
function renderControls() {
  const ctl = $('#ctl'); ctl.innerHTML = '';
  const b = (label, fn, cls = '') => { const e = document.createElement('button'); e.className = 'btn ' + cls; e.innerHTML = label; e.onclick = fn; ctl.appendChild(e); return e; };
  b(speed ? t('pause') : t('play'), () => { speed = speed ? 0 : 1; renderControls(); }, 'big ' + (speed ? 'on' : 'go'));
  b(t('month'), () => { speed = 0; advance(); renderControls(); });
  b(t('year'), () => { speed = 0; for (let i = 0; i < 12 && !G.over; i++) advance(); if (G.over) showEnd(); renderControls(); });
  SPEEDS.forEach((s, i) => b(`${s}×`, () => { speedIx = i; if (!speed) speed = 1; renderControls(); }, i === speedIx ? 'on' : ''));
  b(t('newGame'), () => showNew());
  b(t('lang'), () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('sg_lang', lang); } catch (e) { /* ignore */ } document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant'; render(); });
}

// ---------------------------------------------------------------- side panel
function render() { renderControls(); renderTabs(); renderHeader(); renderPane(); }
function renderTabs() {
  const tabs = $('#tabs'); tabs.innerHTML = '';
  for (const k of [...(G.player ? ['court'] : []), 'chron', 'facs', 'gens', 'cities', 'treasures']) { const b = document.createElement('button'); b.textContent = t(k) + (k === 'court' && G.pending.length ? ` (${G.pending.length})` : ''); b.className = ui.tab === k ? 'on' : ''; b.onclick = () => { ui.tab = k; ui.gen = null; ui.fac = null; if (k !== 'cities') ui.sel = ui.sel; renderTabs(); renderPane(); }; tabs.appendChild(b); }
}
function renderPane() {
  const p = $('#pane'), keep = p.scrollTop;
  if (ui.gen != null) p.innerHTML = genCard(G.gens[ui.gen]);
  else if (ui.fac) p.innerHTML = facCard(G.factions[ui.fac]);
  else if (ui.tab === 'court' && G.player) { p.innerHTML = court(); bindCourt(); }
  else if (ui.tab === 'chron') p.innerHTML = chronicle();
  else if (ui.tab === 'facs') p.innerHTML = factions();
  else if (ui.tab === 'gens') { p.innerHTML = generals(); bindGenFilters(); }
  else if (ui.tab === 'treasures') p.innerHTML = treasures();
  else p.innerHTML = ui.sel != null ? cityCard(G.cities[ui.sel]) : cityList();
  p.querySelectorAll('[data-g]').forEach((e) => { e.onclick = (ev) => { ev.stopPropagation(); ui.gen = +e.dataset.g; ui.fac = null; renderPane(); $('#pane').scrollTop = 0; }; });
  p.querySelectorAll('[data-f]').forEach((e) => { e.onclick = (ev) => { ev.stopPropagation(); ui.fac = e.dataset.f; ui.gen = null; renderPane(); $('#pane').scrollTop = 0; }; });
  p.querySelectorAll('[data-c]').forEach((e) => { e.onclick = (ev) => { ev.stopPropagation(); ui.sel = +e.dataset.c; ui.tab = 'cities'; ui.gen = null; ui.fac = null; renderTabs(); renderPane(); $('#pane').scrollTop = 0; }; });
  p.querySelectorAll('[data-chip]').forEach((e) => { e.onclick = () => { ui.filter = e.dataset.chip; renderPane(); }; });
  p.querySelectorAll('[data-back]').forEach((e) => { e.onclick = () => { ui.gen = null; ui.fac = null; if (e.dataset.back === 'city') ui.sel = null; renderPane(); }; });
  p.querySelectorAll('[data-sort]').forEach((e) => { e.onclick = () => { ui.gsort = e.dataset.sort; renderPane(); }; });
  if (ui.tab === 'gens' && ui.gen == null && !ui.fac) { const i = $('#gq'); if (i && document.activeElement !== i && ui.focusQ) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  if (ui.tab !== 'chron' || ui.gen != null || ui.fac) p.scrollTop = keep;
}
const swatch = (fid) => `<span class="sw" style="background:${fid && G.factions[fid] ? G.factions[fid].color : '#6a655a'}"></span>`;
const facLink = (fid) => (fid && G.factions[fid] ? `<span class="tag" data-f="${fid}">${swatch(fid)}${esc(N(G.factions[fid].name))}</span>` : `<span class="tag">${t('neutral')}</span>`);
const genLink = (g) => `<span class="tag" data-g="${g.id}">${esc(N(g.name))}</span>`;
const cityLink = (c) => `<span class="tag" data-c="${c.id}">${esc(CN(c.name))}</span>`;

// the lord's court: the proposal waiting for an answer, the automatic setting, and how recent decisions turned out
const ICON = { war: '⚔', absorb: '🏳', betray: '🗡', ally: '🕊', truce: '📜', lure: '💬', item: '💎', captive: '⛓',
  farm: '🌾', comm: '💰', def: '🧱', morale: '🏮', train: '🏹', draft: '🪖', reward: '🎁', search: '🔍', recruitGen: '🤝' };
const icon = (prop) => ICON[prop.type === 'job' ? prop.job : prop.type] || '📜';
function court() {
  const f = G.factions[G.player], cs = citiesOf(G, f.id), gs = gensOf(G, f.id), lord = G.gens[f.lord];
  const opt = (v, k) => `<option value="${v}" ${G.auto.mode === v ? 'selected' : ''}>${t(k)}</option>`;
  let h = `<div class="realm"><span class="sw" style="background:${f.color}"></span><b>${esc(N(f.name))}</b> · ${t('lord')} ${genLink(lord)}
    <span class="dim">${t('nCities')} ${cs.length} · ${t('nGens')} ${gs.length} · ${t('troops')} ${big(cs.reduce((s, c) => s + c.troops, 0))} · ${t('gold')} ${big(Math.max(0, f.gold))} · ${t('food')} ${big(f.food)}</span></div>
    <div class="autoset"><label>${t('autoMode')} <select id="amode">${opt('manual', 'manual')}${opt('smart', 'smart')}${opt('all', 'approveAll')}</select></label>
    <label><input type="checkbox" id="awar" ${G.auto.askWar ? 'checked' : ''}> ${t('askWar')}</label></div>`;
  const prop = G.pending[0];
  if (prop) {
    const g = G.gens[prop.g], [title, say] = proposalText(prop, lang), c = prop.city != null ? G.cities[prop.city] : null, P = prop.p;
    const meta = [];
    if (prop.type === 'war') { meta.push(`${t('troops')} ${big(P.troops)}`); meta.push(`${t('from')} ${P.from.map((x) => esc(CN(x))).join(lang === 'en' ? ', ' : '、')}`); meta.push(`${t('withArmy')} ${P.army.map((x) => esc(N(x))).join(lang === 'en' ? ', ' : '、')}`); meta.push(`<b class="${P.chance >= 60 ? 'hi' : P.chance >= 35 ? 'mid' : 'lo'}">${t('odds')} ${P.chance}%</b>`); }
    if (prop.type === 'captive') meta.push(`<b class="${P.chance >= 50 ? 'hi' : P.chance >= 25 ? 'mid' : 'lo'}">${t('persuadeOdds')} ${P.chance}%</b>`);
    if (prop.type === 'job' && c && ['farm', 'comm', 'def', 'morale', 'train'].includes(prop.job)) { const max = { farm: c.farmMax, comm: c.commMax, def: c.defMax, morale: 100, train: 100 }[prop.job]; meta.push(`${t(prop.job === 'def' ? 'def' : prop.job)} ${c[prop.job]} / ${max}`); }
    if (prop.type === 'job' && c && prop.job === 'draft') meta.push(`${t('troops')} ${big(c.troops)} / ${big(capacity(c))}`);
    const btns = prop.type === 'captive' ? `<button class="btn go big" id="cyes">${t('persuade')}</button><button class="btn big" id="cno">${t('releaseB')}</button><button class="btn big danger" id="cexe">${t('execute')}</button>`
      : `<button class="btn go big" id="cyes">${t('approve')}</button><button class="btn big" id="cno">${t('reject')}</button>`;
    h += `<div class="prop"><div class="who"><span class="seal" style="background:${f.color}">${esc(g.name[0])}</span><div>${genLink(g)} ${c ? `<span class="dim">@${esc(CN(c.name))}</span>` : ''}<br>
      <small class="dim">${t('lead')} ${g.lead} ${t('warS')} ${g.war} ${t('int')} ${g.int} ${t('pol')} ${g.pol} ${t('cha')} ${g.cha} · ${t('loyaltyS')} ${g.loyalty}</small></div></div>
      <h3>${icon(prop)} ${esc(title)}</h3><p class="say">${esc(say)}</p>${meta.length ? `<p class="meta">${meta.join(' · ')}</p>` : ''}
      <div class="btns">${btns}</div><small class="dim">${G.pending.length > 1 ? `${G.pending.length - 1} ${t('waiting')}` : t('lastOne')}</small></div>`;
  } else h += `<div class="prop idle"><p>${t('noPending')}</p><div class="btns"><button class="btn go big" id="cplay">${t('play')}</button><button class="btn big" id="cnext">${t('month')}</button></div><small class="dim">${t('courtHint')}</small></div>`;
  const recent = G.decided.slice().reverse();
  if (recent.length) h += `<h3>${t('decided')}</h3>` + recent.map((r) => { const [title] = proposalText(r.prop, lang); return `<div class="ev dec ${r.ok ? 'ok' : r.rejected ? 'no' : ''}" style="border-left-color:${f.color}"><span class="d">${dateStr(r.year, r.month, lang)}</span><span>${icon(r.prop)} <b>${esc(title)}</b>　${esc(decisionText(r, lang))}</span></div>`; }).join('');
  return h;
}
function bindCourt() {
  const on = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  on('cyes', () => answer(true)); on('cno', () => answer(false)); on('cexe', () => answer(false, 'execute'));
  on('cplay', () => { speed = 1; renderControls(); }); on('cnext', () => { speed = 0; advance(); renderControls(); renderPane(); });
  const m = $('#amode'); if (m) m.onchange = () => { G.auto.mode = autoSet.mode = m.value; ui.flash = ui.flash.concat(autoDecide(G)); if (!G.pending.length && ui.resume) { ui.resume = false; speed = 1; } renderControls(); renderTabs(); renderPane(); };
  const w = $('#awar'); if (w) w.onchange = () => { G.auto.askWar = autoSet.askWar = w.checked; ui.flash = ui.flash.concat(autoDecide(G)); if (!G.pending.length && ui.resume) { ui.resume = false; speed = 1; } renderControls(); renderTabs(); renderPane(); };
}

// the chronicle, newest first
function chronicle() {
  const F = { major: (e) => e.level >= 2, all: () => true, war: (e) => e.kind === 'war' || e.kind === 'duel' || e.kind === 'fall' || e.kind === 'rebel', diplo: (e) => e.kind === 'diplo' || e.kind === 'defect' || e.key === 'surrender',
    people: (e) => ['join', 'death', 'succession', 'appear', 'release'].includes(e.kind), events: (e) => ['event', 'item', 'spell'].includes(e.kind) || e.key === 'hiddenAppear' };
  const list = [];
  for (let i = G.log.length - 1; i >= 0 && list.length < 300; i--) if (F[ui.filter](G.log[i])) list.push(G.log[i]);
  const chips = ['major', 'all', 'war', 'diplo', 'people', 'events'].map((k) => `<span class="chip ${ui.filter === k ? 'on' : ''}" data-chip="${k}">${t(k)}</span>`).join('');
  return `<div class="chips">${chips}</div>` + list.map((e) => {
    const col = e.fac && G.factions[e.fac] ? G.factions[e.fac].color : '#555', attr = e.g != null ? `data-g="${e.g}"` : e.city != null ? `data-c="${e.city}"` : '';
    return `<div class="ev lv${e.level} ${attr ? 'click' : ''}" ${attr} style="border-left-color:${col}"><span class="d">${dateStr(e.year, e.month, lang)}</span><span>${esc(fmt(e, lang))}</span></div>`;
  }).join('');
}
// the warlords, by size
function factions() {
  const alive = Object.values(G.factions).filter((f) => f.alive).map((f) => ({ f, cs: citiesOf(G, f.id), gs: gensOf(G, f.id) })).sort((a, b) => b.cs.length - a.cs.length || power(G, b.f.id) - power(G, a.f.id));
  const dead = Object.values(G.factions).filter((f) => !f.alive).sort((a, b) => (b.died || 0) - (a.died || 0));
  return `<table><tr><th>${t('faction')}</th><th class="num">${t('nCities')}</th><th class="num">${t('nGens')}</th><th class="num">${t('troops')}</th><th class="num">${t('gold')}</th><th class="num">${t('food')}</th></tr>`
    + alive.map(({ f, cs, gs }) => `<tr class="row" data-f="${f.id}"><td>${swatch(f.id)}${esc(N(f.name))}</td><td class="num">${cs.length}</td><td class="num">${gs.length}</td><td class="num">${big(cs.reduce((s, c) => s + c.troops, 0))}</td><td class="num">${big(f.gold)}</td><td class="num">${big(f.food)}</td></tr>`).join('')
    + `</table><h3>${t('fallen')}</h3><table>` + dead.map((f) => `<tr class="row dead" data-f="${f.id}"><td>${swatch(f.id)}${esc(N(f.name))}</td><td class="num">${t('peak')} ${f.peak}</td><td class="num">${f.died != null ? G.start + Math.floor(f.died / 12) : ''}</td></tr>`).join('') + '</table>';
}
function facCard(f) {
  const cs = citiesOf(G, f.id), gs = gensOf(G, f.id).sort((a, b) => b.lead + b.war + b.int + b.pol + b.cha - (a.lead + a.war + a.int + a.pol + a.cha)), lord = G.gens[f.lord];
  const allies = Object.keys(f.allies).filter((o) => f.allies[o] > G.t && G.factions[o].alive), truces = Object.keys(f.truce).filter((o) => f.truce[o] > G.t && G.factions[o].alive);
  const deeds = G.log.filter((e) => e.fac === f.id && e.level >= 2).slice(-25).reverse();
  return `<button class="back" data-back="1">${t('back')}</button><div class="card"><h2 style="color:${f.color}">${esc(N(f.name))}</h2>
    <div class="sub">${f.alive ? '' : t('dead') + ' · '}${t('peak')} ${f.peak} ${t('nCities')}</div>
    <div class="kv"><span>${t('lord')}</span><span>${genLink(lord)}</span><span>${t('capital')}</span><span>${lord.status === 'serving' ? cityLink(G.cities[lord.city]) : '—'}</span>
    <span>${t('troops')}</span><span>${big(cs.reduce((s, c) => s + c.troops, 0))}</span><span>${t('gold')} / ${t('food')}</span><span>${big(f.gold)} / ${big(f.food)}</span>
    <span>${t('allies')}</span><span>${allies.map(facLink).join('') || t('none')}</span><span>${t('truce')}</span><span>${truces.map(facLink).join('') || t('none')}</span></div>
    <h3>${t('cities')} (${cs.length})</h3>${cs.map(cityLink).join('')}
    <h3>${t('gens')} (${gs.length})</h3>${gs.map(genLink).join('')}
    ${G.items.some((it) => it.fac === f.id) ? `<h3>${t('treasury')}</h3>${G.items.filter((it) => it.fac === f.id).map((it) => `<span class="tag item">${esc(itemName(it.key, lang))}</span>`).join('')}` : ''}
    <h3>${t('deeds')}</h3>${deeds.map((e) => `<div class="ev lv${e.level}" style="border-left-color:${f.color}"><span class="d">${dateStr(e.year, e.month, lang)}</span><span>${esc(fmt(e, lang))}</span></div>`).join('')}</div>`;
}
// the 500 generals
const total = (g) => g.lead + g.war + g.int + g.pol + g.cha;
function generals() {
  const qq = ui.gq.trim().toLowerCase();
  const visible = G.gens.filter((g) => !(g.hidden && g.status === 'unborn'));
  let list = visible.filter((g) => (!ui.gstatus || g.status === ui.gstatus) && (!ui.gfac || g.fac === ui.gfac) && (!qq || g.name.includes(ui.gq.trim()) || romanize(g.name).toLowerCase().includes(qq)));
  const key = ui.gsort;
  list.sort((a, b) => (key === 'name' ? a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'zh-Hant') : key === 'age' ? a.born - b.born : key === 'total' ? total(b) - total(a) : b[key] - a[key]));
  const facOpts = Object.values(G.factions).filter((f) => f.alive).map((f) => `<option value="${f.id}" ${ui.gfac === f.id ? 'selected' : ''}>${esc(N(f.name))}</option>`).join('');
  const st = ['', 'serving', 'free', 'unborn', 'dead'].map((s) => `<option value="${s}" ${ui.gstatus === s ? 'selected' : ''}>${s ? t(s) : t('anyStatus')}</option>`).join('');
  const th = (k, label) => `<th class="num" data-sort="${k}" style="${ui.gsort === k ? 'color:var(--gold2)' : ''}">${label}</th>`;
  return `<div class="filters"><input id="gq" placeholder="${t('search')}" value="${esc(ui.gq)}"><select id="gs">${st}</select><select id="gf"><option value="">${t('anyFac')}</option>${facOpts}</select></div>
    <div class="count">${list.length} / ${visible.length}</div>
    <table><tr><th data-sort="name">${t('name')}</th>${th('lead', t('lead'))}${th('war', t('warS'))}${th('int', t('int'))}${th('pol', t('pol'))}${th('cha', t('cha'))}${th('total', t('total'))}</tr>`
    + list.slice(0, 250).map((g) => `<tr class="row ${g.status === 'dead' ? 'dead' : ''}" data-g="${g.id}"><td>${swatch(g.status === 'serving' ? g.fac : null)}${esc(N(g.name))}</td><td class="num">${g.lead}</td><td class="num">${g.war}</td><td class="num">${g.int}</td><td class="num">${g.pol}</td><td class="num">${g.cha}</td><td class="num">${total(g)}</td></tr>`).join('') + '</table>';
}
function bindGenFilters() {
  const i = $('#gq'); if (i) i.oninput = () => { ui.gq = i.value; ui.focusQ = true; renderPane(); };
  const s = $('#gs'); if (s) s.onchange = () => { ui.gstatus = s.value; ui.focusQ = false; renderPane(); };
  const f = $('#gf'); if (f) f.onchange = () => { ui.gfac = f.value; ui.focusQ = false; renderPane(); };
}
function genCard(g) {
  const statusTxt = g.status === 'serving' ? `${t('serving')}` : t(g.status), f = g.status === 'serving' ? g.fac : null;
  const isLord = f && G.factions[f].lord === g.id;
  const bars = [['lead', t('lead')], ['war', t('warS')], ['int', t('int')], ['pol', t('pol')], ['cha', t('cha')]].map(([k, l]) => `<div class="stat"><span>${l}</span><span class="bar"><i style="width:${Math.min(100, g[k])}%"></i></span><span class="num">${g[k]}${g[k] > g.base[k] ? `<small class="plus">+${g[k] - g.base[k]}</small>` : ''}</span></div>`).join('');
  const items = heldBy(G, g), bonus = (it) => Object.entries(it.fx).map(([k, v]) => `${t(k === 'war' ? 'warS' : k)}+${v}`).join(' ');
  const deeds = G.log.filter((e) => e.g === g.id || (e.p && Object.values(e.p).includes(g.name))).slice(-40).reverse();
  return `<button class="back" data-back="1">${t('back')}</button><div class="card"><h2>${esc(N(g.name))}${lang === 'en' ? ` <small style="font-size:16px;color:var(--dim)">${esc(g.name)}</small>` : ''}</h2>
    <div class="sub">${g.born}–${g.died}${g.status !== 'dead' && g.status !== 'unborn' ? ` · ${t('age')} ${G.year - g.born}` : ''}${g.status === 'unborn' ? ` · ${g.appear} ${t('ofAge')}` : ''}${isLord ? ` · ${t('lord')}` : ''}</div>
    ${g.hidden ? `<div class="sub hiddenTag">✦ ${t('hiddenGen')}</div>` : ''}
    ${bars}
    ${items.length ? `<h3>${t('gear')}</h3>${items.map((it) => `<div class="item"><b>${esc(itemName(it.key, lang))}</b> <small>${T.slots[it.slot][lang === 'en' ? 1 : 0]} · ${bonus(it)}</small></div>`).join('')}` : ''}
    ${g.spells.length ? `<h3>${t('spells')}</h3>${g.spells.map((sp) => `<span class="tag spell">✧ ${esc(spellName(sp, lang))}</span>`).join('')}` : ''}
    <div class="kv"><span>${t('status')}</span><span>${statusTxt}</span><span>${t('faction')}</span><span>${f ? facLink(f) : '—'}</span>
    <span>${t('city')}</span><span>${g.status === 'dead' || g.status === 'unborn' ? '—' : cityLink(G.cities[g.city])}</span>
    ${f ? `<span>${t('loyalty')}</span><span>${g.loyalty}</span><span>${t('task')}</span><span>${g.task ? T.tasks[g.task][lang === 'en' ? 1 : 0] : '—'}</span>` : ''}
    <span>${t('merit')}</span><span>${g.merit}</span><span>${t('duels')}</span><span>${g.duelsWon}</span><span>${t('kills')}</span><span>${g.kills}</span></div>
    <h3>${t('deeds')}</h3>${deeds.map((e) => `<div class="ev lv${e.level}" style="border-left-color:${e.fac && G.factions[e.fac] ? G.factions[e.fac].color : '#555'}"><span class="d">${dateStr(e.year, e.month, lang)}</span><span>${esc(fmt(e, lang))}</span></div>`).join('') || t('none')}</div>`;
}
// every famous item: who has it, or which treasury, or nobody knows
function treasures() {
  const where = (it) => (it.holder != null ? genLink(G.gens[it.holder]) : it.fac ? facLink(it.fac) : `<span class="dim">${t('unknown')}</span>`);
  const bonus = (it) => Object.entries(it.fx).map(([k, v]) => `${t(k === 'war' ? 'warS' : k)}+${v}`).join(' ');
  const list = G.items.filter((it) => it.holder != null || it.fac || it.city != null);
  return `<table><tr><th>${t('treasures')}</th><th></th><th>${t('holder')}</th></tr>` + list.map((it) => `<tr><td><b>${esc(itemName(it.key, lang))}</b><br><small class="dim">${bonus(it)}${it.teaches.length ? ' · ✧ ' + it.teaches.map((sp) => esc(spellName(sp, lang))).join(', ') : ''}</small></td><td class="dim">${T.slots[it.slot][lang === 'en' ? 1 : 0]}</td><td>${where(it)}</td></tr>`).join('') + '</table>';
}
// cities
function cityList() {
  return `<table><tr><th>${t('cities')}</th><th>${t('owner')}</th><th class="num">${t('troops')}</th><th class="num">${t('pop')}</th></tr>`
    + [...G.cities].sort((a, b) => b.size - a.size || b.troops - a.troops).map((c) => `<tr class="row" data-c="${c.id}"><td>${esc(CN(c.name))}</td><td>${swatch(c.owner)}${c.owner ? esc(N(G.factions[c.owner].name)) : t('neutral')}</td><td class="num">${big(c.troops)}</td><td class="num">${big(c.pop)}</td></tr>`).join('') + '</table>';
}
function cityCard(c) {
  const here = G.gens.filter((g) => g.status === 'serving' && g.city === c.id), free = G.gens.filter((g) => g.status === 'free' && g.city === c.id);
  const bar = (k, max, label) => `<div class="stat"><span>${label}</span><span class="bar"><i style="width:${Math.min(100, c[k] / max * 100)}%"></i></span><span class="num">${c[k]}</span></div>`;
  return `<button class="back" data-back="city">${t('back')}</button><div class="card"><h2>${esc(CN(c.name))}</h2><div class="sub">${c.owner ? facLink(c.owner) : t('neutral')}</div>
    <div class="kv"><span>${t('gov')}</span><span>${c.gov != null ? genLink(G.gens[c.gov]) : '—'}</span><span>${t('troops')}</span><span>${big(c.troops)} / ${big(capacity(c))}</span><span>${t('pop')}</span><span>${big(c.pop)}</span></div>
    ${bar('farm', c.farmMax, t('farm'))}${bar('comm', c.commMax, t('comm'))}${bar('def', c.defMax, t('def'))}${bar('train', 100, t('train'))}${bar('morale', 100, t('morale'))}
    <h3>${t('here')} (${here.length})</h3>${here.map(genLink).join('') || t('none')}
    <h3>${t('wanderers')} (${free.length})</h3>${free.map(genLink).join('') || t('none')}
    <h3>${t('roads')}</h3>${c.adj.map((a) => cityLink(G.cities[a])).join('')}</div>`;
}

// ---------------------------------------------------------------- dialogs
function modal(html) { const m = $('#modal'); m.innerHTML = `<div class="box">${html}</div>`; m.hidden = false; return m; }
function showNew(first) {
  speed = 0; renderControls();
  const cur = (G && G.scenario) || q.get('sc') || '190';
  const m = modal(`<h2>${t('title')}</h2>
    <label>${t('scenario')}</label><select id="nscen">${SCENARIOS.map((S) => `<option value="${S.id}" ${S.id === cur ? 'selected' : ''}>${S.id === 'heroes' ? '' : S.year + ' '}${S.name[lang === 'en' ? 1 : 0]}</option>`).join('')}</select>
    <p id="ndesc"></p>
    <label>${t('playAs')}</label><select id="nplayer"></select>
    <label>${t('seed')}</label><input id="nseed" type="number" value="${first && q.get('seed') ? +q.get('seed') : Math.floor(Math.random() * 99999)}">
    <label>${t('lifespan')}</label><select id="nlife"><option value="history">${t('hist')}</option><option value="long">${t('long')}</option></select>
    <div class="row2"><button class="btn go big" id="ngo">${t('start')}</button></div>`);
  const want = (G && G.player) || q.get('pl') || 'cao';
  const sel = m.querySelector('#nscen'), desc = () => {
    m.querySelector('#ndesc').textContent = SCEN[sel.value].desc[lang === 'en' ? 1 : 0];
    const fs = SCEN[sel.value].factions, pickId = fs.some((x) => x[0] === want) ? want : fs[0][0];
    m.querySelector('#nplayer').innerHTML = fs.map(([id, name, lord, color, cities]) => `<option value="${id}" ${id === pickId ? 'selected' : ''}>${esc(N(lord))}${name !== lord ? ` (${esc(N(name))})` : ''} · ${cities.length} ${t('nCities')}</option>`).join('') + `<option value="">${t('watchOnly')}</option>`;
  };
  sel.onchange = desc; desc();
  m.querySelector('#ngo').onclick = () => { m.hidden = true; start(+m.querySelector('#nseed').value || 1, m.querySelector('#nlife').value, sel.value, m.querySelector('#nplayer').value || null); speed = G.player ? 0 : 1; renderControls(); };
}
function showFell() {
  renderControls();
  const m = modal(`<h2>${t('realmFell')}</h2><p>${t('fellText')}</p><div class="row2"><button class="btn" id="fkeep">${t('keepWatching')}</button><button class="btn go" id="fnew">${t('newGame')}</button></div>`);
  m.querySelector('#fkeep').onclick = () => { m.hidden = true; G.player = null; ui.tab = 'chron'; render(); };
  m.querySelector('#fnew').onclick = () => { m.hidden = true; showNew(); };
}
function showEnd() {
  renderControls();
  const won = G.over !== 'time', f = won && G.factions[G.over], lord = f && G.gens[f.lord], mineWon = won && G.over === G.player;
  const wars = G.log.filter((e) => e.kind === 'war').length, duels = G.log.filter((e) => e.kind === 'duel').length, fell = Object.values(G.factions).filter((x) => !x.alive).length;
  const m = modal(`<h2>${mineWon ? t('realmWon') : won ? t('unified') : t('undecided')}</h2>
    ${won ? `<div class="big" style="color:${f.color}">${esc(N(lord.name))} · ${dateStr(G.year, G.month, lang)}</div>` : ''}
    <p>${G.year - G.start} ${t('years')} · ${wars} ${t('wars')} · ${duels} ${t('duelsN')} · ${fell} ${t('fallenN')}</p>
    <div class="row2"><button class="btn" id="ekeep">${t('keepWatching')}</button><button class="btn go" id="enew">${t('newGame')}</button></div>`);
  m.querySelector('#ekeep').onclick = () => { m.hidden = true; ui.tab = 'chron'; ui.filter = 'major'; render(); };
  m.querySelector('#enew').onclick = () => { m.hidden = true; showNew(); };
}

// ---------------------------------------------------------------- map interaction
const mapEl = $('#map'), tip = $('#tip');
mapEl.addEventListener('mousemove', (e) => {
  if (!G || !view) return;
  const r = mapEl.getBoundingClientRect(), c = cityAt(G, view, e.clientX - r.left, e.clientY - r.top);
  if (!c) { tip.hidden = true; return; }
  const f = c.owner && G.factions[c.owner], gov = c.gov != null ? G.gens[c.gov] : null;
  tip.innerHTML = `<b>${esc(CN(c.name))}</b><br>${f ? `${swatch(c.owner)}${esc(N(f.name))}` : t('neutral')}${gov ? ` · ${t('gov')} ${esc(N(gov.name))}` : ''}<br>${t('troops')} ${big(c.troops)} · ${t('pop')} ${big(c.pop)}<br>${t('def')} ${c.def} · ${t('train')} ${c.train}`;
  tip.hidden = false;
  const x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
  tip.style.left = Math.min(x, r.width - 250) + 'px'; tip.style.top = Math.min(y, r.height - 120) + 'px';
});
mapEl.addEventListener('mouseleave', () => { tip.hidden = true; });
mapEl.addEventListener('click', (e) => {
  if (!G || !view) return;
  const r = mapEl.getBoundingClientRect(), c = cityAt(G, view, e.clientX - r.left, e.clientY - r.top);
  if (c) { ui.sel = c.id; ui.tab = 'cities'; ui.gen = null; ui.fac = null; renderTabs(); renderPane(); }
});
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ') { e.preventDefault(); speed = speed ? 0 : 1; renderControls(); }
  if (e.key === 'ArrowRight') { speed = 0; advance(); renderControls(); }
});

// ---------------------------------------------------------------- go
document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
start(+q.get('seed') || Math.floor(Math.random() * 99999), undefined, q.get('sc') || '190', q.get('pl') || null);
if (!q.get('seed')) showNew(true);
requestAnimationFrame(frame);
window.__sg = { get G() { return G; }, advance, answer, start, setSpeed: (s) => { speed = s; }, showGen: (id) => { ui.gen = id; ui.fac = null; renderPane(); } };   // for tests
