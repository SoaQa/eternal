(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;
  GAME.DATA = GAME.DATA || {};

  // ===== Реликвии =====
  GAME.DATA.relics = {

    // --- Стартовая ---
    phoenix_feather: {
      id: 'phoenix_feather', name: 'Перо феникса', emoji: '🪶',
      rarity: 'starter',
      desc: 'Тёплый пепел затягивает раны. В конце боя восстанавливает 6 ОЗ.',
      hooks: { combatEnd: [{ type: 'heal', value: 6 }] }
    },

    // --- Обычные (common) ---
    vanguard_banner: {
      id: 'vanguard_banner', name: 'Стяг авангарда', emoji: '🚩',
      rarity: 'common',
      desc: 'Рваное знамя тех, кто всегда шёл первым. В начале боя вы берёте 2 карты.',
      hooks: { combatStart: [{ type: 'draw', value: 2 }] }
    },
    obsidian_amulet: {
      id: 'obsidian_amulet', name: 'Обсидиановый оберег', emoji: '🖤',
      rarity: 'common',
      desc: 'Холодный камень принимает первый удар на себя. В начале боя вы получаете 6 блока.',
      hooks: { combatStart: [{ type: 'block', value: 6 }] }
    },
    wyvern_claw: {
      id: 'wyvern_claw', name: 'Коготь виверны', emoji: '🦴',
      rarity: 'common',
      desc: 'Ещё помнит вкус добычи. В начале боя вы получаете 1 Силы.',
      hooks: { combatStart: [{ type: 'applySelf', status: 'strength', value: 1 }] }
    },
    gravedigger_purse: {
      id: 'gravedigger_purse', name: 'Кисет могильщика', emoji: '💰',
      rarity: 'common',
      desc: 'Мёртвым золото ни к чему. Золота из боёв на 25% больше.',
      passive: { goldPct: 25 }
    },
    whetstone: {
      id: 'whetstone', name: 'Точильный камень', emoji: '🪨',
      rarity: 'common',
      desc: 'Сталь поёт, когда её кормят. Каждая 3-я сыгранная атака даёт 1 карту.',
      hooks: { onCardPlayed: { cardType: 'attack', everyN: 3, effects: [{ type: 'draw', value: 1 }] } }
    },
    hermit_kettle: {
      id: 'hermit_kettle', name: 'Котелок отшельника', emoji: '🍲',
      rarity: 'common',
      desc: 'Похлёбка из трав, что растут только на могилах. Отдых у костра лечит на 20% больше.',
      passive: { restBonusPct: 20 }
    },
    alchemist_belt: {
      id: 'alchemist_belt', name: 'Пояс алхимика', emoji: '🧷',
      rarity: 'common',
      desc: 'Потёртая кожа, петли под склянки. Даёт 1 дополнительный слот для зелий.',
      passive: { potionSlots: 1 }
    },

    // --- Необычные (uncommon) ---
    bloody_idol: {
      id: 'bloody_idol', name: 'Кровавый идол', emoji: '🗿',
      rarity: 'uncommon',
      desc: 'Идол пьёт вашу боль и платит яростью. Получив урон по здоровью, вы получаете 1 Силы.',
      hooks: { onDamaged: [{ type: 'applySelf', status: 'strength', value: 1 }] }
    },
    madman_beads: {
      id: 'madman_beads', name: 'Чётки безумца', emoji: '📿',
      rarity: 'uncommon',
      desc: 'Перебирайте — и мир отступит. Каждая 6-я сыгранная карта даёт 3 блока.',
      hooks: { onCardPlayed: { everyN: 6, effects: [{ type: 'block', value: 3 }] } }
    },
    handless_clock: {
      id: 'handless_clock', name: 'Часы без стрелок', emoji: '🕰️',
      rarity: 'uncommon',
      desc: 'Они отмеряют не время, а круги. При перетасовке колоды вы получаете 1 энергию.',
      hooks: { onShuffle: [{ type: 'energy', value: 1 }] }
    },
    bronze_scales: {
      id: 'bronze_scales', name: 'Бронзовая чешуя', emoji: '🐉',
      rarity: 'uncommon',
      desc: 'Врастает в кожу и не спрашивает согласия. В начале боя вы получаете Металлизацию 2: в конце каждого хода +2 блока.',
      hooks: { combatStart: [{ type: 'applySelf', status: 'metallicize', value: 2 }] }
    },
    living_water_flask: {
      id: 'living_water_flask', name: 'Фляга живой воды', emoji: '🫗',
      rarity: 'uncommon',
      desc: 'На дне всегда остаётся один глоток. В начале вашего хода восстанавливает 1 ОЗ.',
      hooks: { turnStart: [{ type: 'heal', value: 1 }] }
    },
    pain_needle: {
      id: 'pain_needle', name: 'Игла боли', emoji: '🪡',
      rarity: 'uncommon',
      desc: 'Носите под кожей — пусть колет других. В начале боя вы получаете Шипы 2: бьющий вас вблизи получает 2 урона в ответ.',
      hooks: { combatStart: [{ type: 'applySelf', status: 'thorns', value: 2 }] }
    },

    // --- Редкие (rare) ---
    volcano_heart: {
      id: 'volcano_heart', name: 'Сердце вулкана', emoji: '🌋',
      rarity: 'rare',
      desc: 'Оно всё ещё бьётся, и каждый удар — жар. В начале вашего хода все враги получают 2 урона.',
      hooks: { turnStart: [{ type: 'damageAll', value: 2 }] }
    },
    world_tree_root: {
      id: 'world_tree_root', name: 'Корень мирового древа', emoji: '🌳',
      rarity: 'rare',
      desc: 'В нём течёт сок, что старше богов. Максимальное здоровье увеличено на 14.',
      passive: { maxHp: 14 }
    },
    void_cloak: {
      id: 'void_cloak', name: 'Плащ пустоты', emoji: '🌫️',
      rarity: 'rare',
      desc: 'Сотканное из ничего не удержать ничем. В начале боя вы получаете Артефакт 1: первое ослабление от врага рассеется впустую.',
      hooks: { combatStart: [{ type: 'applySelf', status: 'artifact', value: 1 }] }
    },
    archlich_skull: {
      id: 'archlich_skull', name: 'Череп архилича', emoji: '💀',
      rarity: 'rare',
      desc: 'Он шепчет литанию, и вы становитесь страшнее. В начале боя вы получаете Ритуал 1: в конце каждого хода +1 Силы.',
      hooks: { combatStart: [{ type: 'applySelf', status: 'ritual', value: 1 }] }
    },
    fallen_aegis: {
      id: 'fallen_aegis', name: 'Эгида павшего рыцаря', emoji: '🛡️',
      rarity: 'rare',
      desc: 'Хозяин пал, но щит не знает об этом. В конце вашего хода вы получаете 3 блока.',
      hooks: { turnEnd: [{ type: 'block', value: 3 }] }
    },

    // --- Боссовые (boss) ---
    fallen_king_crown: {
      id: 'fallen_king_crown', name: 'Корона падшего короля', emoji: '👑',
      rarity: 'boss',
      desc: 'Власть, от которой не отказываются. +1 к максимуму энергии, но каждый враг начинает бой с 1 Силы: корона шепчет всем.',
      passive: { maxEnergy: 1 },
      hooks: { combatStart: [{ type: 'applyAllEnemies', status: 'strength', value: 1 }] }
    },
    abyss_eye: {
      id: 'abyss_eye', name: 'Око бездны', emoji: '👁️',
      rarity: 'boss',
      desc: 'Оно смотрит сквозь ваши веки и видит наперёд. В начале хода вы берёте на 1 карту больше.',
      passive: { drawPerTurn: 1 }
    },
    demon_chalice: {
      id: 'demon_chalice', name: 'Чаша демона', emoji: '🍷',
      rarity: 'boss',
      desc: 'Пейте — сила ваша, долг тоже ваш. +1 к максимуму энергии, но золота из боёв на 25% меньше: демон берёт свою долю.',
      passive: { maxEnergy: 1, goldPct: -25 }
    },

    // --- Лавочные (shop) ---
    guild_seal: {
      id: 'guild_seal', name: 'Печать мёртвой гильдии', emoji: '🪙',
      rarity: 'shop',
      desc: 'Гильдии давно нет, но должники помнят. Цены в лавках на 20% ниже.',
      passive: { shopDiscountPct: 20 }
    },
    smuggler_scales: {
      id: 'smuggler_scales', name: 'Весы контрабандиста', emoji: '⚖️',
      rarity: 'shop',
      desc: 'Всегда врут в вашу пользу. В начале боя вы получаете 1 Ловкости.',
      hooks: { combatStart: [{ type: 'applySelf', status: 'dexterity', value: 1 }] }
    }
  };

  GAME.DATA.startingRelic = 'phoenix_feather';

  // ===== Зелья =====
  GAME.DATA.potions = {
    fire_potion: {
      id: 'fire_potion', name: 'Зелье огня', emoji: '🧪', rarity: 'common',
      desc: 'Склянка запертого пожара. Нанести 20 урона.',
      combatOnly: true, target: 'enemy',
      effects: [{ type: 'damage', value: 20 }]
    },
    stoneskin_brew: {
      id: 'stoneskin_brew', name: 'Отвар каменной кожи', emoji: '🥌', rarity: 'common',
      desc: 'Горчит гранитной крошкой. Получить 12 блока.',
      combatOnly: true, target: 'self',
      effects: [{ type: 'block', value: 12 }]
    },
    pilgrim_elixir: {
      id: 'pilgrim_elixir', name: 'Эликсир пилигрима', emoji: '🍶', rarity: 'common',
      desc: 'Пахнет домом, которого больше нет. Восстановить 20 ОЗ.',
      combatOnly: false, target: 'self',
      effects: [{ type: 'heal', value: 20 }]
    },
    thunder_tincture: {
      id: 'thunder_tincture', name: 'Гремучая настойка', emoji: '⚡', rarity: 'common',
      desc: 'Бьёт в голову, как молния в шпиль. Получить 2 энергии.',
      combatOnly: true, target: 'none',
      effects: [{ type: 'energy', value: 2 }]
    },
    seer_smoke: {
      id: 'seer_smoke', name: 'Дым прозрения', emoji: '🌀', rarity: 'common',
      desc: 'Вдохните — и грядущее подскажет ходы. Взять 3 карты.',
      combatOnly: true, target: 'none',
      effects: [{ type: 'draw', value: 3 }]
    },
    berserker_blood: {
      id: 'berserker_blood', name: 'Кровь берсерка', emoji: '🩸', rarity: 'common',
      desc: 'Чужая ярость, разлитая по склянкам. Получить 2 Силы.',
      combatOnly: true, target: 'self',
      effects: [{ type: 'applySelf', status: 'strength', value: 2 }]
    },
    witch_venom: {
      id: 'witch_venom', name: 'Яд болотной ведьмы', emoji: '☠️', rarity: 'common',
      desc: 'Мутная жижа, в которой что-то шевелится. Наложить 6 Яда.',
      combatOnly: true, target: 'enemy',
      effects: [{ type: 'applyTarget', status: 'poison', value: 6 }]
    },
    stupor_pollen: {
      id: 'stupor_pollen', name: 'Дурманная пыльца', emoji: '🥀', rarity: 'common',
      desc: 'Горсть праха увядших садов. Наложить 2 Слабости на всех врагов.',
      combatOnly: true, target: 'none',
      effects: [{ type: 'applyAllEnemies', status: 'weak', value: 2 }]
    }
  };
})();
