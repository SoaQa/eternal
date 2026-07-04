#!/usr/bin/env node
// Валидатор файлов данных по docs/GAME_SPEC.md.
// Использование: node tests/validate-data.js [cards|enemies|relics|events]...
// Без аргументов проверяет все существующие файлы данных.

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'www', 'js', 'data');

const errors = [];
let ctx = '';
function err(msg) { errors.push(`[${ctx}] ${msg}`); }

function loadFile(name) {
  const file = path.join(DATA_DIR, name + '.js');
  if (!fs.existsSync(file)) return false;
  try {
    // eslint-disable-next-line no-eval
    (0, eval)(fs.readFileSync(file, 'utf8'));
    return true;
  } catch (e) {
    ctx = name;
    err(`файл не выполняется: ${e.message}`);
    return false;
  }
}

const CARD_EFFECTS = new Set(['damage', 'damageAll', 'block', 'draw', 'energy', 'heal', 'loseHP',
  'gainMaxHP', 'gold', 'applyTarget', 'applyAllEnemies', 'applySelf', 'addCard',
  'exhaustRandomHand', 'discardRandomHand', 'special']);
const SPECIALS = new Set(['bodyslam', 'execute', 'drain', 'finisher', 'second_wind', 'catalyst']);
const STATUSES = new Set(['strength', 'dexterity', 'weak', 'vulnerable', 'frail', 'poison',
  'regen', 'thorns', 'artifact', 'ritual', 'metallicize']);
const ENEMY_MOVE_EFFECTS = new Set(['damage', 'block', 'heal', 'applyPlayer', 'applySelf', 'addCardPlayer']);
const ENEMY_SELF_STATUSES = new Set(['strength', 'ritual', 'metallicize', 'thorns', 'artifact', 'regen']);
const PLAYER_DEBUFFS = new Set(['weak', 'vulnerable', 'frail', 'poison']);
const STATUS_CARDS = new Set(['wound', 'dazed', 'slimed']);
const CARD_TYPES = new Set(['attack', 'skill', 'power', 'status', 'curse']);
const CARD_RARITIES = new Set(['starter', 'common', 'uncommon', 'rare', 'special']);
const TARGETS = new Set(['enemy', 'all', 'self', 'none', 'random']);
const INTENTS = new Set(['attack', 'defend', 'buff', 'debuff', 'attack_debuff', 'unknown']);
const TIERS = new Set(['normal', 'elite', 'boss']);
const RELIC_RARITIES = new Set(['starter', 'common', 'uncommon', 'rare', 'boss', 'shop']);
const RELIC_HOOKS = new Set(['combatStart', 'turnStart', 'turnEnd', 'combatEnd', 'onShuffle', 'onDamaged', 'onCardPlayed']);
const RELIC_HOOK_EFFECTS = new Set(['damageAll', 'block', 'draw', 'energy', 'heal', 'loseHP', 'applySelf', 'applyAllEnemies', 'addCard']);
const RELIC_PASSIVES = new Set(['maxEnergy', 'maxHp', 'drawPerTurn', 'potionSlots', 'restBonusPct', 'shopDiscountPct', 'goldPct']);
const OUTCOME_TYPES = new Set(['gold', 'hp', 'maxhp', 'heal_full', 'add_card_choice', 'add_random_card',
  'remove_card_choice', 'upgrade_card_choice', 'random_relic', 'potion_random', 'curse', 'nothing']);
const CYRILLIC = /[А-Яа-яЁё]/;

function isNum(v) { return typeof v === 'number' && isFinite(v); }
function isInt(v) { return Number.isInteger(v); }
function ruText(v, what) {
  if (typeof v !== 'string' || !v.trim()) { err(`${what}: пустая или не строка`); return; }
  if (!CYRILLIC.test(v)) err(`${what}: нет кириллицы («${v}»)`);
}
function checkId(id, what) {
  if (!/^[a-z][a-z0-9_]*$/.test(id)) err(`${what}: id «${id}» должен быть snake_case латиницей`);
}

function checkEffectList(list, what, allowed, opts = {}) {
  if (!Array.isArray(list)) { err(`${what}: effects должен быть массивом`); return; }
  for (const e of list) {
    if (!e || typeof e !== 'object') { err(`${what}: эффект не объект`); continue; }
    if (!allowed.has(e.type)) { err(`${what}: недопустимый type эффекта «${e.type}»`); continue; }
    const needValue = !['addCard', 'addCardPlayer', 'special', 'heal_full', 'applyTarget', 'applyAllEnemies', 'applySelf', 'applyPlayer'].includes(e.type);
    if (needValue && !isNum(e.value)) err(`${what}: у эффекта ${e.type} нет числового value`);
    if ('times' in e && e.times !== 'X' && !(isInt(e.times) && e.times >= 1)) err(`${what}: ${e.type}.times должен быть целым >=1 или 'X'`);
    if (e.times === 'X' && !opts.xCost) err(`${what}: times:'X' разрешён только у карт с cost:'X'`);
    if (e.type === 'applyTarget' || e.type === 'applyAllEnemies' || e.type === 'applySelf' || e.type === 'applyPlayer') {
      const set = e.type === 'applyPlayer' ? PLAYER_DEBUFFS : (opts.enemySelf && e.type === 'applySelf' ? ENEMY_SELF_STATUSES : STATUSES);
      if (!set.has(e.status)) err(`${what}: ${e.type}: недопустимый статус «${e.status}»`);
      if (!isNum(e.value)) err(`${what}: ${e.type}: нет числового value`);
    }
    if (e.type === 'special') {
      if (!SPECIALS.has(e.id)) err(`${what}: special id «${e.id}» вне белого списка`);
    }
    if (e.type === 'addCard' || e.type === 'addCardPlayer') {
      if (typeof e.card !== 'string') err(`${what}: ${e.type}: нет card`);
      else pendingCardRefs.push([what, e.card, e.type === 'addCardPlayer']);
      if (!['hand', 'draw', 'discard'].includes(e.where)) err(`${what}: ${e.type}: where «${e.where}» недопустим`);
      if ('count' in e && !(isInt(e.count) && e.count >= 1)) err(`${what}: ${e.type}: count должен быть целым >=1`);
    }
  }
}

const pendingCardRefs = []; // [context, cardId, mustBeStatusCard]

function validateCards(D) {
  ctx = 'cards';
  if (!D.cards || typeof D.cards !== 'object') { err('нет GAME.DATA.cards'); return; }
  const byRarity = {};
  for (const [key, c] of Object.entries(D.cards)) {
    ctx = `cards:${key}`;
    if (c.id !== key) err(`id «${c.id}» не совпадает с ключом`);
    checkId(key, 'карта');
    ruText(c.name, 'name');
    ruText(c.desc, 'desc');
    if (!CARD_TYPES.has(c.type)) err(`недопустимый type «${c.type}»`);
    if (!CARD_RARITIES.has(c.rarity)) err(`недопустимая rarity «${c.rarity}»`);
    byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1;
    if (c.cost !== 'X' && !(isInt(c.cost) && c.cost >= 0)) err(`cost «${c.cost}» должен быть целым >=0 или 'X'`);
    if (!TARGETS.has(c.target)) err(`недопустимый target «${c.target}»`);
    if (typeof c.emoji !== 'string' || !c.emoji) err('нет emoji');
    if (!c.unplayable) {
      checkEffectList(c.effects, 'effects', CARD_EFFECTS, { xCost: c.cost === 'X' });
      const hasTargeted = (c.effects || []).some(e => ['damage', 'applyTarget', 'special'].includes(e.type) && e.type !== 'special' || (e.type === 'special' && e.id !== 'second_wind'));
      if (c.target === 'enemy' && !(c.effects || []).length) err('target enemy без эффектов');
    } else if (c.effects && c.effects.length) {
      err('unplayable карта с эффектами розыгрыша');
    }
    if (c.endTurnInHand) checkEffectList(c.endTurnInHand, 'endTurnInHand', new Set(['loseHP', 'applySelf']));
    if ((c.type === 'status' || c.type === 'curse') && c.rarity !== 'special') err('status/curse должны иметь rarity special');
    if (c.type === 'curse' && !c.unplayable) err('curse должна быть unplayable');
    if (c.upgrade) {
      if (c.upgrade.effects) checkEffectList(c.upgrade.effects, 'upgrade.effects', CARD_EFFECTS, { xCost: (c.upgrade.cost !== undefined ? c.upgrade.cost : c.cost) === 'X' });
      if (c.upgrade.desc) ruText(c.upgrade.desc, 'upgrade.desc');
    } else if (c.type !== 'status' && c.type !== 'curse') {
      err('нет upgrade (обязателен для играбельных карт)');
    }
  }
  ctx = 'cards';
  for (const sc of STATUS_CARDS) if (!D.cards[sc]) err(`отсутствует обязательная статус-карта «${sc}»`);
  const curses = Object.values(D.cards).filter(c => c.type === 'curse');
  if (curses.length < 3) err(`проклятий ${curses.length}, нужно >=3`);
  if (!Array.isArray(D.startingDeck) || D.startingDeck.length < 8) err('startingDeck отсутствует или короче 8 карт');
  else for (const id of D.startingDeck) if (!D.cards[id]) err(`startingDeck: карты «${id}» нет`);
  const counts = { common: byRarity.common || 0, uncommon: byRarity.uncommon || 0, rare: byRarity.rare || 0 };
  if (counts.common < 16) err(`common карт ${counts.common}, нужно >=16`);
  if (counts.uncommon < 16) err(`uncommon карт ${counts.uncommon}, нужно >=16`);
  if (counts.rare < 10) err(`rare карт ${counts.rare}, нужно >=10`);
}

function validateEnemies(D) {
  ctx = 'enemies';
  if (!D.enemies || typeof D.enemies !== 'object') { err('нет GAME.DATA.enemies'); return; }
  for (const [key, e] of Object.entries(D.enemies)) {
    ctx = `enemies:${key}`;
    if (e.id !== key) err('id не совпадает с ключом');
    checkId(key, 'враг');
    ruText(e.name, 'name');
    if (typeof e.emoji !== 'string' || !e.emoji) err('нет emoji');
    if (!(isInt(e.hpMin) && isInt(e.hpMax) && e.hpMin > 0 && e.hpMax >= e.hpMin)) err('hpMin/hpMax некорректны');
    if (![1, 2, 3].includes(e.act)) err(`act «${e.act}» должен быть 1..3`);
    if (!TIERS.has(e.tier)) err(`tier «${e.tier}» недопустим`);
    if (!e.moves || !Object.keys(e.moves).length) { err('нет moves'); continue; }
    for (const [mk, m] of Object.entries(e.moves)) {
      ruText(m.name, `move ${mk}: name`);
      if (!INTENTS.has(m.intent)) err(`move ${mk}: intent «${m.intent}» недопустим`);
      checkEffectList(m.effects, `move ${mk}`, ENEMY_MOVE_EFFECTS, { enemySelf: true });
      for (const ef of m.effects || []) {
        if (ef.type === 'addCardPlayer' && !STATUS_CARDS.has(ef.card)) err(`move ${mk}: addCardPlayer разрешён только для wound/dazed/slimed`);
      }
    }
    if (!e.ai || !Array.isArray(e.ai.rules) || !e.ai.rules.length) { err('нет ai.rules'); continue; }
    if (e.ai.first && !e.moves[e.ai.first]) err(`ai.first «${e.ai.first}» не найден в moves`);
    for (const r of e.ai.rules) {
      if (!e.moves[r.move]) err(`ai: move «${r.move}» не найден`);
      if (!(isNum(r.weight) && r.weight > 0)) err(`ai: у «${r.move}» нет weight > 0`);
      if ('maxRepeat' in r && !(isInt(r.maxRepeat) && r.maxRepeat >= 1)) err(`ai: maxRepeat у «${r.move}» некорректен`);
      for (const k of ['minHpPct', 'maxHpPct']) if (k in r && !(isNum(r[k]) && r[k] >= 0 && r[k] <= 100)) err(`ai: ${k} у «${r.move}» вне 0..100`);
    }
    if (e.tier === 'boss' && Object.keys(e.moves).length < 3) err('у босса должно быть >=3 ходов');
  }
  ctx = 'encounters';
  if (!D.encounters) { err('нет GAME.DATA.encounters'); return; }
  for (const act of [1, 2, 3]) {
    const a = D.encounters[act];
    if (!a) { err(`нет пулов для акта ${act}`); continue; }
    for (const pool of ['normal', 'elite', 'boss']) {
      const arr = a[pool];
      if (!Array.isArray(arr) || !arr.length) { err(`акт ${act}: пул ${pool} пуст`); continue; }
      if (pool === 'normal' && arr.length < 5) err(`акт ${act}: normal-пулов ${arr.length}, нужно >=5`);
      if (pool === 'elite' && arr.length < 2) err(`акт ${act}: elite-пулов ${arr.length}, нужно >=2`);
      for (const enc of arr) {
        if (!Array.isArray(enc) || !enc.length || enc.length > 3) { err(`акт ${act} ${pool}: бой должен быть массивом из 1-3 id`); continue; }
        for (const id of enc) {
          const en = D.enemies[id];
          if (!en) { err(`акт ${act} ${pool}: врага «${id}» нет`); continue; }
          if (pool === 'boss' && en.tier !== 'boss') err(`акт ${act}: «${id}» в boss-пуле, но tier=${en.tier}`);
          if (pool === 'elite' && en.tier !== 'elite') err(`акт ${act}: «${id}» в elite-пуле, но tier=${en.tier}`);
          if (pool === 'normal' && en.tier !== 'normal') err(`акт ${act}: «${id}» в normal-пуле, но tier=${en.tier}`);
          if (en.act !== act) err(`акт ${act}: враг «${id}» с act=${en.act}`);
        }
      }
    }
  }
  const bosses = Object.values(D.enemies).filter(e => e.tier === 'boss');
  if (bosses.length < 3) { ctx = 'enemies'; err(`боссов ${bosses.length}, нужно >=3`); }
}

function validateRelics(D) {
  ctx = 'relics';
  if (!D.relics || typeof D.relics !== 'object') { err('нет GAME.DATA.relics'); return; }
  for (const [key, r] of Object.entries(D.relics)) {
    ctx = `relics:${key}`;
    if (r.id !== key) err('id не совпадает с ключом');
    checkId(key, 'реликвия');
    ruText(r.name, 'name');
    ruText(r.desc, 'desc');
    if (typeof r.emoji !== 'string' || !r.emoji) err('нет emoji');
    if (!RELIC_RARITIES.has(r.rarity)) err(`rarity «${r.rarity}» недопустима`);
    if (!r.hooks && !r.passive) err('нет ни hooks, ни passive');
    if (r.hooks) {
      for (const [hk, hv] of Object.entries(r.hooks)) {
        if (!RELIC_HOOKS.has(hk)) { err(`хук «${hk}» недопустим`); continue; }
        if (hk === 'onCardPlayed') {
          if (!hv || !Array.isArray(hv.effects)) { err('onCardPlayed: нет effects'); continue; }
          if (hv.cardType && !['attack', 'skill', 'power'].includes(hv.cardType)) err(`onCardPlayed.cardType «${hv.cardType}» недопустим`);
          if ('everyN' in hv && !(isInt(hv.everyN) && hv.everyN >= 1)) err('onCardPlayed.everyN некорректен');
          checkEffectList(hv.effects, `hook ${hk}`, RELIC_HOOK_EFFECTS);
        } else {
          checkEffectList(hv, `hook ${hk}`, RELIC_HOOK_EFFECTS);
        }
      }
    }
    if (r.passive) {
      for (const [pk, pv] of Object.entries(r.passive)) {
        if (!RELIC_PASSIVES.has(pk)) err(`пассив «${pk}» недопустим`);
        if (!isNum(pv)) err(`пассив ${pk}: не число`);
      }
    }
  }
  ctx = 'relics';
  if (!D.startingRelic || !D.relics[D.startingRelic]) err('startingRelic отсутствует или не найдена');
  const cnt = r => Object.values(D.relics).filter(x => x.rarity === r).length;
  if (Object.keys(D.relics).length < 18) err(`реликвий ${Object.keys(D.relics).length}, нужно >=18`);
  if (cnt('boss') < 2) err('boss-реликвий нужно >=2');
  if (cnt('shop') < 2) err('shop-реликвий нужно >=2');

  ctx = 'potions';
  if (!D.potions || typeof D.potions !== 'object') { err('нет GAME.DATA.potions'); return; }
  for (const [key, p] of Object.entries(D.potions)) {
    ctx = `potions:${key}`;
    if (p.id !== key) err('id не совпадает с ключом');
    ruText(p.name, 'name');
    ruText(p.desc, 'desc');
    if (typeof p.emoji !== 'string' || !p.emoji) err('нет emoji');
    if (typeof p.combatOnly !== 'boolean') err('нет combatOnly');
    if (!['enemy', 'self', 'none'].includes(p.target)) err(`target «${p.target}» недопустим`);
    checkEffectList(p.effects, 'effects', CARD_EFFECTS);
  }
  if (Object.keys(D.potions).length < 6) { ctx = 'potions'; err('зелий нужно >=6'); }
}

function validateEvents(D) {
  ctx = 'events';
  if (!D.events || typeof D.events !== 'object') { err('нет GAME.DATA.events'); return; }
  for (const [key, ev] of Object.entries(D.events)) {
    ctx = `events:${key}`;
    if (ev.id !== key) err('id не совпадает с ключом');
    ruText(ev.name, 'name');
    ruText(ev.text, 'text');
    if (typeof ev.emoji !== 'string' || !ev.emoji) err('нет emoji');
    if (!Array.isArray(ev.choices) || ev.choices.length < 2) { err('нужно >=2 choices'); continue; }
    for (const [i, ch] of ev.choices.entries()) {
      ruText(ch.label, `choice ${i}: label`);
      ruText(ch.resultText, `choice ${i}: resultText`);
      if (!Array.isArray(ch.outcomes)) { err(`choice ${i}: outcomes не массив`); continue; }
      for (const o of ch.outcomes) {
        if (!OUTCOME_TYPES.has(o.type)) { err(`choice ${i}: outcome «${o.type}» недопустим`); continue; }
        if (['gold', 'hp', 'maxhp'].includes(o.type) && !isNum(o.value)) err(`choice ${i}: ${o.type} без value`);
      }
      if (ch.require) for (const k of Object.keys(ch.require)) if (!['hp', 'gold'].includes(k)) err(`choice ${i}: require.${k} недопустим`);
    }
  }
  if (Object.keys(D.events).length < 10) { ctx = 'events'; err(`событий ${Object.keys(D.events).length}, нужно >=10`); }
}

// --- main ---
const requested = process.argv.slice(2);
const all = ['cards', 'enemies', 'relics', 'events'];
const toCheck = requested.length ? requested : all.filter(n => fs.existsSync(path.join(DATA_DIR, n + '.js')));
if (!toCheck.length) { console.log('Нет файлов данных для проверки.'); process.exit(0); }

globalThis.window = undefined; // файлы должны работать через globalThis
const loaded = new Set();
for (const name of toCheck) if (loadFile(name)) loaded.add(name);

const D = (globalThis.GAME && globalThis.GAME.DATA) || {};
if (loaded.has('cards')) validateCards(D);
if (loaded.has('enemies')) validateEnemies(D);
if (loaded.has('relics')) validateRelics(D);
if (loaded.has('events')) validateEvents(D);

// перекрёстные ссылки addCard -> cards (проверяем только если cards загружен)
if (D.cards) {
  for (const [what, cardId, mustBeStatus] of pendingCardRefs) {
    ctx = what;
    if (!D.cards[cardId]) err(`ссылка на несуществующую карту «${cardId}»`);
  }
}

if (errors.length) {
  console.error(`ОШИБКИ (${errors.length}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
} else {
  console.log(`OK: ${[...loaded].join(', ')} — валидны.`);
}
