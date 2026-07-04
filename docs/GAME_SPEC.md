# Eternal — Вечная Башня. Спецификация данных и движка

Карточный фэнтези-рогалик (deckbuilder, в духе Slay the Spire). 3 акта, портретный экран, весь текст игры — на русском. Ядро — HTML5/JS (без фреймворков), работает в Android WebView.

## Глобальное пространство имён

Каждый JS-файл начинается с шаблона:

```js
(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;
  GAME.DATA = GAME.DATA || {};
  // ... содержимое файла ...
})();
```

Файлы данных пишут ТОЛЬКО в `GAME.DATA.*`. Никаких обращений к DOM, `document`, `localStorage`. Файл должен выполняться в чистом Node без ошибок (`node --check` и `node tests/validate-data.js <name>`).

## Файлы данных (пишут контент-агенты)

| Файл | Экспортирует |
|---|---|
| `www/js/data/cards.js` | `GAME.DATA.cards`, `GAME.DATA.startingDeck` |
| `www/js/data/enemies.js` | `GAME.DATA.enemies`, `GAME.DATA.encounters` |
| `www/js/data/relics.js` | `GAME.DATA.relics`, `GAME.DATA.potions`, `GAME.DATA.startingRelic` |
| `www/js/data/events.js` | `GAME.DATA.events` |

Все id — латиница snake_case. Все видимые игроку строки (`name`, `desc`, `text`, `label`, `resultText`, названия ходов врагов) — на русском.

---

## DSL эффектов (исполняются движком по порядку)

Эффекты карт, зелий и хуков реликвий — массив объектов. Разрешённые `type`:

| type | поля | смысл |
|---|---|---|
| `damage` | `value`, `times?` | урон цели (модифицируется Силой, Слабостью, Уязвимостью). `times` — число или `'X'` (для карт с cost `'X'`) |
| `damageAll` | `value`, `times?` | урон всем врагам |
| `block` | `value`, `times?` | блок себе (модифицируется Ловкостью, Хрупкостью). `times` может быть `'X'` |
| `draw` | `value` | взять карты |
| `energy` | `value` | получить энергию |
| `heal` | `value` | лечение себе |
| `loseHP` | `value` | потерять HP (без блока), себе |
| `gainMaxHP` | `value` | +макс. HP |
| `gold` | `value` | золото (только вне боя / события) |
| `applyTarget` | `status`, `value` | наложить статус на цель |
| `applyAllEnemies` | `status`, `value` | статус на всех врагов |
| `applySelf` | `status`, `value` | статус на себя |
| `addCard` | `card`, `where` (`'hand'|'draw'|'discard'`), `count?`, `upgraded?` | добавить копии карты в бою |
| `exhaustRandomHand` | `value` | истощить случайные карты из руки |
| `discardRandomHand` | `value` | сбросить случайные карты из руки |
| `special` | `id`, `value?` | из белого списка ниже |

Белый список `special` (движок реализует ровно это):

- `bodyslam` — урон цели, равный текущему блоку игрока.
- `execute` `{value}` — урон value; если у цели < 50% HP — урон удваивается.
- `drain` `{value}` — урон value; лечение на нанесённый сквозь блок урон.
- `finisher` `{value}` — урон value за каждую сыгранную в этом ходу карту-атаку (включая эту).
- `second_wind` `{value}` — истощить все не-атаки из руки, за каждую +value блока.
- `catalyst` — удвоить яд на цели.

## Статусы

На игрока и врагов (если осмысленно):

| status | тип | эффект |
|---|---|---|
| `strength` | пост., может быть <0 | +N к урону каждого удара |
| `dexterity` | пост. | +N к блоку от карт |
| `weak` | ходы | атаки слабее на 25% |
| `vulnerable` | ходы | получаемый урон +50% |
| `frail` | ходы | блок от карт −25% (только игрок) |
| `poison` | стаки | в начале хода носителя: урон = стаки, затем −1 |
| `regen` | стаки | в начале хода: лечение = стаки, затем −1 |
| `thorns` | пост. | ответный урон атакующему в ближнем бою |
| `artifact` | заряды | блокирует следующий дебафф |
| `ritual` | пост. | в конце хода носитель получает N Силы |
| `metallicize` | пост. | в конце хода носитель получает N блока |

## Карты — `GAME.DATA.cards`

```js
strike: {
  id: 'strike', name: 'Удар', emoji: '🗡️',
  type: 'attack',            // 'attack' | 'skill' | 'power' | 'status' | 'curse'
  rarity: 'starter',         // 'starter' | 'common' | 'uncommon' | 'rare' | 'special'
  cost: 1,                   // число >=0, либо 'X'
  target: 'enemy',           // 'enemy' | 'all' | 'self' | 'none' | 'random'
  desc: 'Нанести 6 урона.',  // числа в тексте ОБЯЗАНЫ совпадать с effects
  effects: [{ type: 'damage', value: 6 }],
  exhaust: false, ethereal: false, innate: false, retain: false, // опциональны
  unplayable: false,          // для status/curse
  endTurnInHand: [ ... ],     // опц.: эффекты, если карта в руке в конце хода (для проклятий: [{type:'loseHP',value:1}])
  upgrade: { desc: 'Нанести 9 урона.', effects: [{ type: 'damage', value: 9 }] } // частичный override; имя улучшенной = name+'+'
}
```

- `power`-карты при розыгрыше применяют эффекты и исчезают из боя (обычно `applySelf`).
- Улучшение (`upgrade`) переопределяет любые поля (cost, effects, desc и т.п.). У status/curse `upgrade` не нужен.

**Объём:** 4 стартовые (`strike` 🗡️, `defend` 🛡️, `battle_cry` — атака+уязвимость), ~20 common, ~20 uncommon, ~13 rare. Плюс rarity `'special'`: статус-карты `wound` (Рана, unplayable), `dazed` (Оглушение, unplayable+ethereal), `slimed` (Слизь, cost 1, exhaust, без эффектов) и 3 проклятия (`curse_*`, unplayable, одно с `endTurnInHand` loseHP 1).

`GAME.DATA.startingDeck = ['strike','strike','strike','strike','strike','defend','defend','defend','defend','battle_cry']`

Баланс-ориентиры (за 1 энергию): атака ~6 урона / ~5 блока; common слегка выше со связками; rare — сильные эффекты с ценой (exhaust, loseHP, cost 2-3). Улучшение ≈ +30-50% чисел или −1 к cost.

## Враги — `GAME.DATA.enemies`

```js
goblin_scout: {
  id: 'goblin_scout', name: 'Гоблин-разведчик', emoji: '👺',
  hpMin: 22, hpMax: 26,
  act: 1, tier: 'normal',    // 'normal' | 'elite' | 'boss'
  moves: {
    stab:  { name: 'Пырнуть', intent: 'attack', effects: [{ type: 'damage', value: 7 }] },
    howl:  { name: 'Вой',     intent: 'buff',   effects: [{ type: 'applySelf', status: 'strength', value: 2 }] }
  },
  ai: {
    first: 'howl',            // опц.: первый ход
    rules: [
      { move: 'stab', weight: 3, maxRepeat: 2 },
      { move: 'howl', weight: 1, maxRepeat: 1, minHpPct: 0, maxHpPct: 100, onceOnly: false }
    ]
  }
}
```

Эффекты ходов врага: `damage` (по игроку, `times?`), `block`, `heal`, `applyPlayer {status,value}` (weak/vulnerable/frail/poison), `applySelf` (strength/ritual/metallicize/thorns/artifact/regen), `addCardPlayer {card, where, count?}` (только `wound`/`dazed`/`slimed`). `intent`: `'attack' | 'defend' | 'buff' | 'debuff' | 'attack_debuff' | 'unknown'`.

`minHpPct`/`maxHpPct` — правило активно, когда HP врага в этом диапазоне (проценты). Фазы боссов делать через это.

**Объём и баланс по актам** (урон за ход у normal): акт 1 — HP 12-55, урон 5-9; акт 2 — HP 40-90, урон 9-16; акт 3 — HP 70-140, урон 14-24. Элитки ≈ ×2 от normal, боссы: акт 1 HP ~140, акт 2 ~220, акт 3 ~320, у боссов минимум 3 хода и фазы.

**Состав:** акт 1: 5-6 normal, 2 elite, 1 boss; акт 2: то же; акт 3: то же. Итого ~18-20 врагов.

`GAME.DATA.encounters` — пулы боёв (массивы массивов id, 1-3 врага в бою):

```js
GAME.DATA.encounters = {
  1: { normal: [['goblin_scout'], ['goblin_scout','wolf'], ...], elite: [['golem']], boss: [['goblin_king']] },
  2: { ... }, 3: { ... }
};
```

Каждый id в encounters обязан существовать в `enemies`, и tier врагов должен соответствовать пулу.

## Реликвии — `GAME.DATA.relics`

```js
phoenix_feather: {
  id: 'phoenix_feather', name: 'Перо феникса', emoji: '🪶',
  rarity: 'starter',        // 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop'
  desc: 'В конце боя восстанавливает 6 HP.',
  hooks: { combatEnd: [{ type: 'heal', value: 6 }] }
}
```

Хуки (все опциональны, значения — массивы эффектов из DSL, без `damage` по цели — целей вне контекста нет; разрешены `damageAll`, `block`, `draw`, `energy`, `heal`, `loseHP`, `applySelf`, `applyAllEnemies`, `addCard`):

- `combatStart`, `turnStart`, `turnEnd`, `combatEnd`, `onShuffle` (при перетасовке), `onDamaged` (получен урон по HP)
- `onCardPlayed: { cardType?: 'attack'|'skill'|'power', everyN?: число, effects: [...] }`

Пассивы: `passive: { maxEnergy?, maxHp?, drawPerTurn?, potionSlots?, restBonusPct?, shopDiscountPct?, goldPct? }` (числа; drawPerTurn — доп. карты в начале хода; goldPct — +% золота из боёв).

**Объём:** 1 starter (`GAME.DATA.startingRelic = '<id>'`), ~6 common, ~6 uncommon, ~5 rare, 3 boss (сильный пассив с недостатком — недостаток выражать через комбинацию, напр. maxEnergy+1 и maxHp−10 нельзя — можно: boss-реликвии просто сильные: maxEnergy+1; drawPerTurn+1 и т.п.), 2 shop.

## Зелья — `GAME.DATA.potions`

```js
fire_potion: {
  id: 'fire_potion', name: 'Зелье огня', emoji: '🧪', rarity: 'common',
  desc: 'Нанести 20 урона врагу.',
  combatOnly: true, target: 'enemy',   // 'enemy' | 'self' | 'none'
  effects: [{ type: 'damage', value: 20 }]
}
```

~8 зелий: урон, блок, лечение (combatOnly:false), энергия, добор, сила, яд, очищение? (очищение не поддержано — не делать). Только DSL выше.

## События — `GAME.DATA.events`

```js
old_altar: {
  id: 'old_altar', name: 'Древний алтарь', emoji: '⛩️',
  minAct: 1, maxAct: 3, once: false,
  text: 'Перед вами алтарь, покрытый засохшей кровью...',
  choices: [
    {
      label: 'Принести жертву',
      hint: 'Потерять 7 HP, получить реликвию',   // честно описывает исход
      require: { hp: 8 },                          // опц.: { hp?: N, gold?: N }
      outcomes: [{ type: 'hp', value: -7 }, { type: 'random_relic' }],
      resultText: 'Кровь впитывается в камень. Алтарь дарует вам дар.'
    },
    { label: 'Уйти', outcomes: [], resultText: 'Вы проходите мимо.' }
  ]
}
```

Типы `outcomes`: `gold {value ±}`, `hp {value ±}`, `maxhp {value ±}`, `heal_full`, `add_card_choice {rarity?}` (выбор из 3), `add_random_card {rarity?}`, `remove_card_choice`, `upgrade_card_choice`, `random_relic {rarity?}`, `potion_random`, `curse` (случайное проклятие), `nothing`.

**Объём:** ~12 событий, у каждого 2-3 выбора, риск/награда, у каждого выбора честный `hint`.

---

## Экономика (движок)

- Золото: normal 12-20, elite 30-45 (+реликвия), boss 80-100. Старт: 99 золота.
- Награда за бой: выбор 1 из 3 карт (common 60% / uncommon 33% / rare 7%; после элиток и боссов — сдвиг к редким), зелье с шансом 35%.
- Магазин: 5 карт (50-160 з.), 2 реликвии (140-300 з.), 2 зелья (45-75 з.), удаление карты (75 з., +25 за каждое следующее).
- Костёр: отдых (лечение 30% макс. HP) или улучшение карты.
- Герой: «Странник», 72 HP, 3 энергии, рука 5 карт, 3 слота зелий.

## Карта акта (движок)

15 рядов, 2-4 узла в ряду, DAG снизу вверх. Типы: `monster`, `elite`, `event`, `rest`, `shop`, `treasure`, `boss` (последний ряд). Ряд 0 — только monster; ряд 8 — treasure; ряд 14 — rest перед боссом; elite не раньше ряда 4.
