# 三國志 群雄模擬 · Three Kingdoms Chronicle

A self-running Romance of the Three Kingdoms simulation in the browser. **500 historical generals** come of age, serve, betray,
fight and grow old while the warlords of AD 190 run their realms on their own: **domestic affairs, diplomacy and war**, month
by month, until someone unifies the realm (or the age of warlords drags on to 300). You watch history unfold.

**Play:** https://ywchen0711.github.io/sanguo-sim/  (Chinese and English; `?seed=123` replays the same history)

## What happens

- **The world of 190:** 45 cities joined by roads and 27 warlords: 董卓, 曹操, 袁紹, 韓馥, 袁術, 孫堅, 劉備, 公孫瓚, 劉虞, 公孫度, 劉表,
  劉焉, 張魯, 馬騰, 陶謙, 孔融, 劉岱, 劉繇, 嚴白虎, 王朗, 陸康, 張楊, 金旋, 劉度, 趙範, 孟獲, 士燮.
- **500 generals** with 統率 / 武力 / 智力 / 政治 / 魅力, historical births and deaths, families and the lords they historically served.
  Those too young in 190 (諸葛亮, 陸遜, 姜維, 鄧艾, 司馬昭, 羊祜, 杜預 …) come of age later: family members join the family's faction,
  unaffiliated talents seek out their historical lord if that faction survives, others wander until someone recruits them.
- **內政 Domestic:** every general takes one job a month: farming, commerce, walls, drafting, training, patrols, rewards, searching for
  talent, recruiting. Front-line cities arm; safe cities grow and send men and officers forward. Gold comes in monthly, the harvest in
  the seventh month, soldiers eat and cost upkeep, and famine makes them desert.
- **外交 Diplomacy:** alliances against the strongest neighbour, truces, broken alliances, luring away disloyal officers, and demands
  that a weak neighbour surrender.
- **戰爭 War:** combined offensives from every border city (and grand campaigns from the interior), sieges in rounds with walls,
  training and morale, stratagems by the cleverest officer on each side (fire, ambush, flood, false reports, night raids, rocks),
  一騎討 duels before the walls that can kill, captured officers who join, are released or executed, succession when a lord dies,
  rebellions by disloyal governors, factions that fall and the occasional warlord who rises again.

## Scenarios, events, treasures and spells

- **Six scenarios:** 190 群雄討董, 195 群雄割據, 200 官渡之戰, 208 赤壁之戰, 221 三國鼎立, and a what-if 英雄集結 where all 500 generals are alive at
  once. Each sets the warlords, their cities, alliances and feuds, and where every general serves (`js/data/scenarios.js`). `?sc=208&seed=5` replays one.
- **Random events** every month or so: locusts, plague (a healer stops it), floods, earthquakes, bumper harvests, bandits (a strong governor beats
  them), caravans, omens, comets that foretell a lord's death, sages and training that raise stats, tournaments, sworn brothers, imperial edicts,
  assassins and granary fires.
- **Treasures (寶物):** 25 famous items — 青龍偃月刀, 方天畫戟, 赤兔馬, 的盧, 孫子兵法, 太平要術, 傳國玉璽 … — start with their historical owner or lie
  hidden in a city until a searching officer finds them. They add to stats (a horse also helps escape capture), pass to whoever slays their owner
  in a duel, go to the treasury when an owner dies, and the lord hands them out twice a year.
- **Spells (法術):** 落雷, 妖術, 呼風喚雨, 八陣圖, 奇門遁甲, 幻術 and 治癒 change sieges; 諸葛亮, 于吉, 華佗, 司馬懿 … know them, immortals teach them
  and books (太平要術, 遁甲天書, 青囊書, 兵法二十四篇) can be studied for them.
- **Four hidden generals:** Jeff, Josh, Jasper and Erin may each turn up in any game at a random time and place, with a legendary sword and spells.

## The page

- A map with soft faction territories, rivers, roads, cities (★ = where a lord sits) and the campaigns of the last few months
- A strip chart of how many cities each warlord holds over the years
- **年表 Chronicle** (major / all / war / diplomacy / people), **勢力 Warlords** (with details and deeds), **武將 Generals** (all 500:
  search in Chinese or pinyin, filter by status and warlord, sort by any stat; each has a card with their whole story), **城市 Cities**
- Play / pause, next month, +1 year, speeds 1× to 60×, a new game with any seed and historical or longer lifespans
- Space = play / pause, → = next month

## Files

```
index.html, style.css
js/data/generals.js     the 500 generals (one line each)
js/data/world.js        cities, roads, the warlords of 190
js/data/allegiance.js   who unaffiliated talents historically served
js/data/scenarios.js    the six scenarios
js/data/treasures.js    famous items, spells and the four hidden generals
js/data/pinyin.js       pinyin for the English interface
js/sim/engine.js        the simulation (no DOM: also runs in node)
js/sim/text.js          the chronicle in Chinese or English, names in pinyin
js/ui/map.js, app.js    the map and the page
tools/test.mjs          data checks + whole games checked for consistency:  npm test
tools/sim.mjs           play games headless and print the chronicle
tools/balance.mjs       how fast the map consolidates over many games
```

Plain HTML and JavaScript modules, no build step. Run locally with any static server (`python -m http.server`).
