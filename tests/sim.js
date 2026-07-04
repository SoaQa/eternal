#!/usr/bin/env node
// Headless-симуляция полных забегов: краши, инварианты, грубый баланс.
// Использование: node tests/sim.js [количество_забегов=200]

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'www/js/rng.js',
  'www/js/data/cards.js',
  'www/js/data/enemies.js',
  'www/js/data/relics.js',
  'www/js/data/events.js',
  'www/js/engine/state.js',
  'www/js/engine/map.js',
  'www/js/engine/combat.js',
];
for (const f of FILES) {
  (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}
const GAME = globalThis.GAME;

const N = parseInt(process.argv[2] || '200', 10);
const SMART = process.argv.includes('smart');
const problems = [];
let wins = 0, deaths = [0, 0, 0, 0], totalTurns = 0, totalCombats = 0;
const combatLen = { normal: [], elite: [], boss: [] };

function assert(cond, msg, seed) {
  if (!cond) problems.push(`seed=${seed}: ${msg}`);
}

function checkInvariants(seed, where) {
  const S = GAME.State, run = S.run;
  assert(run.hp >= 0 && run.hp <= run.maxHp, `hp=${run.hp}/${run.maxHp} вне диапазона (${where})`, seed);
  assert(run.gold >= 0, `gold=${run.gold} < 0 (${where})`, seed);
  const c = GAME.Combat.c;
  if (c && !c.result) {
    assert(c.player.energy >= 0, `energy=${c.player.energy} < 0 (${where})`, seed);
    const uids = new Set([...c.hand, ...c.draw, ...c.discard, ...c.exhaust].map(x => x.uid));
    for (const card of run.deck) {
      // power-карты покидают бой законно
      const d = S.cardDef(card);
      if (d.type !== 'power') {
        // карта могла быть истощена — она в exhaust, всё ок; главное — не потеряна и не задублирована
      }
    }
    const all = [...c.hand, ...c.draw, ...c.discard, ...c.exhaust];
    const seen = new Set();
    for (const x of all) {
      assert(!seen.has(x.uid), `дубликат карты uid=${x.uid} в бою (${where})`, seed);
      seen.add(x.uid);
    }
  }
}

function botCombat(seed, botRng, tier) {
  const C = GAME.Combat, S = GAME.State;
  let turns = 0;
  while (!C.c.result) {
    turns++;
    if (turns > 150) { problems.push(`seed=${seed}: бой (${tier}) не завершился за 150 ходов`); break; }
    // зелья иногда
    if (botRng.chance(0.15)) {
      const slot = S.run.potions.findIndex(p => p);
      if (slot >= 0) {
        const p = GAME.DATA.potions[S.run.potions[slot]];
        const alive = C.alive();
        if (alive.length) C.usePotion(slot, p.target === 'enemy' ? C.c.enemies.indexOf(botRng.pick(alive)) : null);
      }
    }
    // играем карты
    let guard = 0;
    while (!C.c.result && guard++ < 40) {
      const playable = C.c.hand.filter(x => C.canPlay(x));
      if (!playable.length) break;
      let inst, target = null;
      if (SMART) {
        const alive = C.alive();
        if (!alive.length) break;
        const incoming = alive.reduce((s, e) => s + ((C.intentPreview(e) || {}).damage || 0), 0);
        const victim = alive.reduce((a, b) => (a.hp <= b.hp ? a : b)); // добиваем слабейшего
        const dmgOf = (d) => (d.effects || []).reduce((s, ef) => {
          const t = ef.times === 'X' ? Math.max(0, C.c.player.energy - (d.cost === 'X' ? 0 : d.cost)) : (ef.times || 1);
          if (ef.type === 'damage') return s + C.calcAttack(C.c.player, victim, ef.value) * t;
          if (ef.type === 'damageAll') return s + C.calcAttack(C.c.player, victim, ef.value) * t;
          if (ef.type === 'special' && ['execute', 'drain', 'finisher'].includes(ef.id)) return s + (ef.value || 6);
          if (ef.type === 'special' && ef.id === 'bodyslam') return s + C.c.player.block;
          return s;
        }, 0);
        const blkOf = (d) => (d.effects || []).reduce((s, ef) => s + (ef.type === 'block' ? ef.value * (ef.times === 'X' ? 1 : ef.times || 1) : 0), 0);
        let best = null, bestScore = -1;
        for (const x of playable) {
          const d = C.def(x);
          let score = 1;
          const dm = dmgOf(d), bl = blkOf(d);
          if (dm >= victim.hp + victim.block) score = 100 + dm;               // летальный удар
          else if (bl > 0 && incoming > C.c.player.block) score = 40 + Math.min(bl, incoming - C.c.player.block);
          else if (d.type === 'power') score = 35;
          else if (dm > 0) score = 10 + dm;
          else score = 5;
          score += botRng.next(); // лёгкий шум
          if (score > bestScore) { bestScore = score; best = x; }
        }
        inst = best;
        const d = C.def(inst);
        if (d.target === 'enemy') target = C.c.enemies.indexOf(victim);
      } else {
        inst = botRng.pick(playable);
        const d = C.def(inst);
        if (d.target === 'enemy') {
          const alive = C.alive();
          if (!alive.length) break;
          target = C.c.enemies.indexOf(botRng.pick(alive));
        }
      }
      const before = C.c.hand.length;
      C.playCard(inst.uid, target);
      checkInvariants(seed, 'после карты ' + inst.id);
      if (C.c.hand.length === before && !C.c.result) break; // защита от зацикливания
    }
    if (!C.c.result) {
      C.endTurn();
      checkInvariants(seed, 'после endTurn');
    }
  }
  totalTurns += turns;
  totalCombats++;
  combatLen[tier === 'normal' ? 'normal' : tier].push(turns);
  return C.c.result;
}

function applyOutcomesSim(outcomes, botRng) {
  const S = GAME.State;
  for (const o of outcomes) {
    switch (o.type) {
      case 'gold': S.gainGold(o.value); break;
      case 'hp': o.value >= 0 ? S.heal(o.value) : S.hurt(-o.value); break;
      case 'maxhp': S.gainMaxHp(o.value); break;
      case 'heal_full': S.heal(S.run.maxHp); break;
      case 'add_random_card': case 'add_card_choice': {
        const pool = o.rarity ? S.cardPool(o.rarity) : S.cardPool('common');
        if (pool.length) S.addCard(botRng.pick(pool).id);
        break;
      }
      case 'remove_card_choice': {
        if (S.run.deck.length > 5) S.removeCard(botRng.pick(S.run.deck).uid);
        break;
      }
      case 'upgrade_card_choice': {
        const c = S.run.deck.find(x => !x.upgraded && GAME.DATA.cards[x.id].upgrade);
        if (c) S.upgradeCard(c.uid);
        break;
      }
      case 'random_relic': { const id = S.randomRelic(o.rarity); if (id) S.addRelic(id); break; }
      case 'potion_random': S.addPotion(S.randomPotion()); break;
      case 'curse': { const id = S.randomCurse(); if (id) S.addCard(id); break; }
    }
  }
}

function runOne(seed) {
  const S = GAME.State, C = GAME.Combat;
  const botRng = new GAME.RNG(seed ^ 0xBEEF);
  S.newRun(seed);
  let steps = 0;
  while (steps++ < 400) {
    const run = S.run;
    if (run.hp <= 0) { deaths[run.act]++; return 'death'; }
    // выбор следующего узла
    let reach;
    if (!run.node) reach = run.map.rows[0].slice();
    else {
      const cur = run.map.nodes[run.node];
      if (cur.row >= GAME.MapGen.ROWS - 1) {
        // босс убит — обработано ниже после боя
        problems.push(`seed=${seed}: застряли на вершине карты`);
        return 'stuck';
      }
      reach = cur.edges.slice();
    }
    if (!reach.length) { problems.push(`seed=${seed}: нет достижимых узлов`); return 'stuck'; }
    const nodeId = botRng.pick(reach);
    const node = run.map.nodes[nodeId];
    node.visited = true;
    run.node = nodeId;

    switch (node.type) {
      case 'monster': case 'elite': case 'boss': {
        const pool = GAME.DATA.encounters[run.act][node.type === 'monster' ? 'normal' : node.type];
        const enc = S.rng.pick(pool);
        C.start(enc, node.type === 'monster' ? 'normal' : node.type);
        checkInvariants(seed, 'начало боя');
        const res = botCombat(seed, botRng, node.type === 'monster' ? 'normal' : node.type);
        if (res === 'defeat') { deaths[run.act]++; return 'death'; }
        if (res !== 'victory') return 'stuck';
        // награды
        const rw = C.c.rewards;
        S.gainGold(rw.gold, true);
        if (rw.cards.length && botRng.chance(0.75)) S.addCard(botRng.pick(rw.cards));
        if (rw.potion) S.addPotion(rw.potion);
        if (rw.relic) S.addRelic(rw.relic);
        if (node.type === 'boss') {
          if (run.act >= 3) { wins++; return 'win'; }
          const pool2 = Object.values(GAME.DATA.relics).filter(r => r.rarity === 'boss' && !run.relics.includes(r.id));
          if (pool2.length) S.addRelic(botRng.pick(pool2).id);
          S.nextAct();
        }
        C.c = null;
        break;
      }
      case 'event': {
        const pool = Object.values(GAME.DATA.events).filter(ev =>
          (!ev.minAct || run.act >= ev.minAct) && (!ev.maxAct || run.act <= ev.maxAct) &&
          (!ev.once || !run.eventsSeen.includes(ev.id)));
        const ev = pool.length ? S.rng.pick(pool) : S.rng.pick(Object.values(GAME.DATA.events));
        run.eventsSeen.push(ev.id);
        const ok = ev.choices.filter(ch => !ch.require ||
          ((ch.require.gold === undefined || run.gold >= ch.require.gold) && (ch.require.hp === undefined || run.hp >= ch.require.hp)));
        const ch = botRng.pick(ok.length ? ok : ev.choices);
        applyOutcomesSim(ch.outcomes, botRng);
        if (run.hp <= 0) { deaths[run.act]++; return 'death'; }
        break;
      }
      case 'rest': {
        if (SMART ? (run.hp < run.maxHp * 0.55) : botRng.chance(0.6)) S.heal(Math.round(run.maxHp * 0.3));
        else {
          const c = run.deck.find(x => !x.upgraded && GAME.DATA.cards[x.id].upgrade);
          if (c) S.upgradeCard(c.uid);
        }
        break;
      }
      case 'shop': {
        run.shop = S.generateShop();
        for (const item of [...run.shop.cards, ...run.shop.relics, ...run.shop.potions]) {
          if (!item.sold && run.gold >= item.price && botRng.chance(0.4)) {
            run.gold -= item.price;
            item.sold = true;
            if (item.kind === 'card') S.addCard(item.id);
            else if (item.kind === 'relic') S.addRelic(item.id);
            else S.addPotion(item.id);
          }
        }
        break;
      }
      case 'treasure': {
        const id = S.randomRelic();
        if (id) S.addRelic(id);
        break;
      }
    }
    checkInvariants(seed, 'узел ' + node.type);
  }
  problems.push(`seed=${seed}: забег не завершился за 400 шагов`);
  return 'stuck';
}

console.log(`Симуляция ${N} забегов (случайный бот)...`);
let crashes = 0;
for (let i = 0; i < N; i++) {
  const seed = 1000 + i * 7919;
  try {
    runOne(seed);
  } catch (e) {
    crashes++;
    problems.push(`seed=${seed}: КРАШ: ${e.message}\n${(e.stack || '').split('\n').slice(1, 4).join('\n')}`);
    if (crashes > 8) break;
  }
}

const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '—';
console.log(`\nИтоги: побед ${wins}/${N} (${(wins / N * 100).toFixed(1)}%)`);
console.log(`Смерти по актам: акт1=${deaths[1]} акт2=${deaths[2]} акт3=${deaths[3]}`);
console.log(`Средняя длина боя (ходов): normal=${avg(combatLen.normal)} elite=${avg(combatLen.elite)} boss=${avg(combatLen.boss)}`);
console.log(`Всего боёв: ${totalCombats}, крашей: ${crashes}`);

if (problems.length) {
  console.error(`\nПРОБЛЕМЫ (${problems.length}, первые 25):`);
  for (const p of problems.slice(0, 25)) console.error('  - ' + p);
  process.exit(1);
} else {
  console.log('\nOK: крашей и нарушений инвариантов нет.');
}
