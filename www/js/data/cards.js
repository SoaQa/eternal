(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;
  GAME.DATA = GAME.DATA || {};

  // ==========================================================================
  // Карты «Eternal — Вечная Башня»
  // 4 starter, 20 common, 20 uncommon, 13 rare, 3 статус-карты, 3 проклятия.
  // ==========================================================================

  GAME.DATA.cards = {

    // ------------------------------------------------------------- STARTER --

    strike: {
      id: 'strike', name: 'Удар', emoji: '🗡️',
      type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
      desc: 'Нанести 6 урона.',
      effects: [{ type: 'damage', value: 6 }],
      upgrade: {
        desc: 'Нанести 9 урона.',
        effects: [{ type: 'damage', value: 9 }]
      }
    },

    defend: {
      id: 'defend', name: 'Защита', emoji: '🛡️',
      type: 'skill', rarity: 'starter', cost: 1, target: 'self',
      desc: 'Получить 5 блока.',
      effects: [{ type: 'block', value: 5 }],
      upgrade: {
        desc: 'Получить 8 блока.',
        effects: [{ type: 'block', value: 8 }]
      }
    },

    battle_cry: {
      id: 'battle_cry', name: 'Боевой клич', emoji: '📣',
      type: 'attack', rarity: 'starter', cost: 2, target: 'enemy',
      desc: 'Нанести 8 урона. Наложить 2 Уязвимости.',
      effects: [
        { type: 'damage', value: 8 },
        { type: 'applyTarget', status: 'vulnerable', value: 2 }
      ],
      upgrade: {
        desc: 'Нанести 10 урона. Наложить 3 Уязвимости.',
        effects: [
          { type: 'damage', value: 10 },
          { type: 'applyTarget', status: 'vulnerable', value: 3 }
        ]
      }
    },

    survival: {
      id: 'survival', name: 'Чутьё странника', emoji: '🧭',
      type: 'skill', rarity: 'starter', cost: 1, target: 'self',
      desc: 'Получить 3 блока. Взять 1 карту.',
      effects: [
        { type: 'block', value: 3 },
        { type: 'draw', value: 1 }
      ],
      upgrade: {
        desc: 'Получить 5 блока. Взять 1 карту.',
        effects: [
          { type: 'block', value: 5 },
          { type: 'draw', value: 1 }
        ]
      }
    },

    // -------------------------------------------------------------- COMMON --

    cleave: {
      id: 'cleave', name: 'Рассечение', emoji: '🪓',
      type: 'attack', rarity: 'common', cost: 1, target: 'all',
      desc: 'Нанести 8 урона всем врагам.',
      effects: [{ type: 'damageAll', value: 8 }],
      upgrade: {
        desc: 'Нанести 11 урона всем врагам.',
        effects: [{ type: 'damageAll', value: 11 }]
      }
    },

    quick_slash: {
      id: 'quick_slash', name: 'Стремительный росчерк', emoji: '⚡',
      type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Нанести 8 урона. Взять 1 карту.',
      effects: [
        { type: 'damage', value: 8 },
        { type: 'draw', value: 1 }
      ],
      upgrade: {
        desc: 'Нанести 11 урона. Взять 1 карту.',
        effects: [
          { type: 'damage', value: 11 },
          { type: 'draw', value: 1 }
        ]
      }
    },

    heavy_blow: {
      id: 'heavy_blow', name: 'Сокрушающий удар', emoji: '🔨',
      type: 'attack', rarity: 'common', cost: 2, target: 'enemy',
      desc: 'Нанести 14 урона.',
      effects: [{ type: 'damage', value: 14 }],
      upgrade: {
        desc: 'Нанести 20 урона.',
        effects: [{ type: 'damage', value: 20 }]
      }
    },

    iron_wave: {
      id: 'iron_wave', name: 'Железная волна', emoji: '🌊',
      type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Нанести 5 урона. Получить 5 блока.',
      effects: [
        { type: 'damage', value: 5 },
        { type: 'block', value: 5 }
      ],
      upgrade: {
        desc: 'Нанести 7 урона. Получить 7 блока.',
        effects: [
          { type: 'damage', value: 7 },
          { type: 'block', value: 7 }
        ]
      }
    },

    twin_bite: {
      id: 'twin_bite', name: 'Двойной укус', emoji: '🐍',
      type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Нанести 4 урона дважды.',
      effects: [{ type: 'damage', value: 4, times: 2 }],
      upgrade: {
        desc: 'Нанести 6 урона дважды.',
        effects: [{ type: 'damage', value: 6, times: 2 }]
      }
    },

    poison_dart: {
      id: 'poison_dart', name: 'Отравленная игла', emoji: '🪡',
      type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
      desc: 'Нанести 3 урона. Наложить 2 Яда.',
      effects: [
        { type: 'damage', value: 3 },
        { type: 'applyTarget', status: 'poison', value: 2 }
      ],
      upgrade: {
        desc: 'Нанести 4 урона. Наложить 3 Яда.',
        effects: [
          { type: 'damage', value: 4 },
          { type: 'applyTarget', status: 'poison', value: 3 }
        ]
      }
    },

    serpent_fang: {
      id: 'serpent_fang', name: 'Клык гадюки', emoji: '🦷',
      type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Нанести 6 урона. Наложить 3 Яда.',
      effects: [
        { type: 'damage', value: 6 },
        { type: 'applyTarget', status: 'poison', value: 3 }
      ],
      upgrade: {
        desc: 'Нанести 8 урона. Наложить 4 Яда.',
        effects: [
          { type: 'damage', value: 8 },
          { type: 'applyTarget', status: 'poison', value: 4 }
        ]
      }
    },

    rot_cloud: {
      id: 'rot_cloud', name: 'Гнилостное облако', emoji: '☁️',
      type: 'skill', rarity: 'common', cost: 1, target: 'all',
      desc: 'Наложить 3 Яда на всех врагов.',
      effects: [{ type: 'applyAllEnemies', status: 'poison', value: 3 }],
      upgrade: {
        desc: 'Наложить 5 Яда на всех врагов.',
        effects: [{ type: 'applyAllEnemies', status: 'poison', value: 5 }]
      }
    },

    shrug: {
      id: 'shrug', name: 'Стиснуть зубы', emoji: '😬',
      type: 'skill', rarity: 'common', cost: 1, target: 'self',
      desc: 'Получить 8 блока. Взять 1 карту.',
      effects: [
        { type: 'block', value: 8 },
        { type: 'draw', value: 1 }
      ],
      upgrade: {
        desc: 'Получить 11 блока. Взять 1 карту.',
        effects: [
          { type: 'block', value: 11 },
          { type: 'draw', value: 1 }
        ]
      }
    },

    bulwark: {
      id: 'bulwark', name: 'Глухая стена', emoji: '🧱',
      type: 'skill', rarity: 'common', cost: 2, target: 'self',
      desc: 'Получить 13 блока.',
      effects: [{ type: 'block', value: 13 }],
      upgrade: {
        desc: 'Получить 18 блока.',
        effects: [{ type: 'block', value: 18 }]
      }
    },

    trip: {
      id: 'trip', name: 'Подсечка', emoji: '🪢',
      type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Наложить 2 Уязвимости. Взять 1 карту.',
      effects: [
        { type: 'applyTarget', status: 'vulnerable', value: 2 },
        { type: 'draw', value: 1 }
      ],
      upgrade: {
        desc: 'Наложить 3 Уязвимости. Взять 1 карту.',
        effects: [
          { type: 'applyTarget', status: 'vulnerable', value: 3 },
          { type: 'draw', value: 1 }
        ]
      }
    },

    wolf_grin: {
      id: 'wolf_grin', name: 'Волчий оскал', emoji: '🐺',
      type: 'skill', rarity: 'common', cost: 0, target: 'all',
      desc: 'Наложить 1 Слабость на всех врагов. Истощение.',
      exhaust: true,
      effects: [{ type: 'applyAllEnemies', status: 'weak', value: 1 }],
      upgrade: {
        desc: 'Наложить 2 Слабости на всех врагов. Истощение.',
        effects: [{ type: 'applyAllEnemies', status: 'weak', value: 2 }]
      }
    },

    sharpen: {
      id: 'sharpen', name: 'Точильный камень', emoji: '🪨',
      type: 'skill', rarity: 'common', cost: 1, target: 'self',
      desc: 'Получить 2 Силы. Истощение.',
      exhaust: true,
      effects: [{ type: 'applySelf', status: 'strength', value: 2 }],
      upgrade: {
        desc: 'Получить 3 Силы. Истощение.',
        effects: [{ type: 'applySelf', status: 'strength', value: 3 }]
      }
    },

    insight: {
      id: 'insight', name: 'Озарение', emoji: '💡',
      type: 'skill', rarity: 'common', cost: 0, target: 'self',
      desc: 'Взять 2 карты. Истощение.',
      exhaust: true,
      effects: [{ type: 'draw', value: 2 }],
      upgrade: {
        desc: 'Взять 3 карты. Истощение.',
        effects: [{ type: 'draw', value: 3 }]
      }
    },

    reckless_swing: {
      id: 'reckless_swing', name: 'Безрассудный замах', emoji: '🌀',
      type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Нанести 10 урона. Сбросить случайную карту из руки.',
      effects: [
        { type: 'damage', value: 10 },
        { type: 'discardRandomHand', value: 1 }
      ],
      upgrade: {
        desc: 'Нанести 13 урона. Сбросить случайную карту из руки.',
        effects: [
          { type: 'damage', value: 13 },
          { type: 'discardRandomHand', value: 1 }
        ]
      }
    },

    first_aid: {
      id: 'first_aid', name: 'Грязная перевязка', emoji: '🩹',
      type: 'skill', rarity: 'common', cost: 1, target: 'self',
      desc: 'Восстановить 5 здоровья. Истощение.',
      exhaust: true,
      effects: [{ type: 'heal', value: 5 }],
      upgrade: {
        desc: 'Восстановить 8 здоровья. Истощение.',
        effects: [{ type: 'heal', value: 8 }]
      }
    },

    steel_flurry: {
      id: 'steel_flurry', name: 'Шквал стали', emoji: '⚔️',
      type: 'attack', rarity: 'common', cost: 2, target: 'enemy',
      desc: 'Нанести 5 урона трижды.',
      effects: [{ type: 'damage', value: 5, times: 3 }],
      upgrade: {
        desc: 'Нанести 7 урона трижды.',
        effects: [{ type: 'damage', value: 7, times: 3 }]
      }
    },

    ember_touch: {
      id: 'ember_touch', name: 'Обжигающее касание', emoji: '🔥',
      type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      desc: 'Нанести 7 урона. Наложить 1 Слабость.',
      effects: [
        { type: 'damage', value: 7 },
        { type: 'applyTarget', status: 'weak', value: 1 }
      ],
      upgrade: {
        desc: 'Нанести 9 урона. Наложить 2 Слабости.',
        effects: [
          { type: 'damage', value: 9 },
          { type: 'applyTarget', status: 'weak', value: 2 }
        ]
      }
    },

    deflect: {
      id: 'deflect', name: 'Отвод клинка', emoji: '🤺',
      type: 'skill', rarity: 'common', cost: 0, target: 'self',
      desc: 'Получить 4 блока.',
      effects: [{ type: 'block', value: 4 }],
      upgrade: {
        desc: 'Получить 7 блока.',
        effects: [{ type: 'block', value: 7 }]
      }
    },

    throwing_knife: {
      id: 'throwing_knife', name: 'Метательный нож', emoji: '🔪',
      type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
      desc: 'Нанести 4 урона.',
      effects: [{ type: 'damage', value: 4 }],
      upgrade: {
        desc: 'Нанести 6 урона.',
        effects: [{ type: 'damage', value: 6 }]
      }
    },

    // ------------------------------------------------------------ UNCOMMON --

    shield_slam: {
      id: 'shield_slam', name: 'Таран щитом', emoji: '🔰',
      type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      desc: 'Нанести урон, равный вашему текущему блоку.',
      effects: [{ type: 'special', id: 'bodyslam' }],
      upgrade: {
        cost: 0,
        desc: 'Нанести урон, равный вашему текущему блоку.'
      }
    },

    leech_blade: {
      id: 'leech_blade', name: 'Клинок-пиявка', emoji: '🧛',
      type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
      desc: 'Нанести 10 урона. Восстановить столько здоровья, сколько урона прошло сквозь блок.',
      effects: [{ type: 'special', id: 'drain', value: 10 }],
      upgrade: {
        desc: 'Нанести 14 урона. Восстановить столько здоровья, сколько урона прошло сквозь блок.',
        effects: [{ type: 'special', id: 'drain', value: 14 }]
      }
    },

    final_chord: {
      id: 'final_chord', name: 'Финальный аккорд', emoji: '🎻',
      type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      desc: 'Нанести 6 урона за каждую атаку, сыгранную в этом ходу (включая эту).',
      effects: [{ type: 'special', id: 'finisher', value: 6 }],
      upgrade: {
        desc: 'Нанести 8 урона за каждую атаку, сыгранную в этом ходу (включая эту).',
        effects: [{ type: 'special', id: 'finisher', value: 8 }]
      }
    },

    second_wind: {
      id: 'second_wind', name: 'Второе дыхание', emoji: '🌬️',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Истощить все карты в руке, кроме атак. За каждую — 5 блока.',
      effects: [{ type: 'special', id: 'second_wind', value: 5 }],
      upgrade: {
        desc: 'Истощить все карты в руке, кроме атак. За каждую — 7 блока.',
        effects: [{ type: 'special', id: 'second_wind', value: 7 }]
      }
    },

    catalyst: {
      id: 'catalyst', name: 'Катализатор', emoji: '⚗️',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy',
      desc: 'Удвоить Яд на цели. Истощение.',
      exhaust: true,
      effects: [{ type: 'special', id: 'catalyst' }],
      upgrade: {
        cost: 0,
        desc: 'Удвоить Яд на цели. Истощение.'
      }
    },

    whirlwind: {
      id: 'whirlwind', name: 'Стальной вихрь', emoji: '🌪️',
      type: 'attack', rarity: 'uncommon', cost: 'X', target: 'all',
      desc: 'Нанести 6 урона всем врагам Х раз.',
      effects: [{ type: 'damageAll', value: 6, times: 'X' }],
      upgrade: {
        desc: 'Нанести 8 урона всем врагам Х раз.',
        effects: [{ type: 'damageAll', value: 8, times: 'X' }]
      }
    },

    battle_trance: {
      id: 'battle_trance', name: 'Боевой транс', emoji: '🧿',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Взять 3 карты.',
      effects: [{ type: 'draw', value: 3 }],
      upgrade: {
        cost: 0,
        desc: 'Взять 3 карты.'
      }
    },

    noxious_brew: {
      id: 'noxious_brew', name: 'Зловонное варево', emoji: '☠️',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy',
      desc: 'Наложить 6 Яда.',
      effects: [{ type: 'applyTarget', status: 'poison', value: 6 }],
      upgrade: {
        desc: 'Наложить 9 Яда.',
        effects: [{ type: 'applyTarget', status: 'poison', value: 9 }]
      }
    },

    paralytic_venom: {
      id: 'paralytic_venom', name: 'Паралитический яд', emoji: '🕷️',
      type: 'skill', rarity: 'uncommon', cost: 2, target: 'all',
      desc: 'Наложить 4 Яда и 2 Слабости на всех врагов.',
      effects: [
        { type: 'applyAllEnemies', status: 'poison', value: 4 },
        { type: 'applyAllEnemies', status: 'weak', value: 2 }
      ],
      upgrade: {
        desc: 'Наложить 6 Яда и 2 Слабости на всех врагов.',
        effects: [
          { type: 'applyAllEnemies', status: 'poison', value: 6 },
          { type: 'applyAllEnemies', status: 'weak', value: 2 }
        ]
      }
    },

    thorn_mail: {
      id: 'thorn_mail', name: 'Терновый доспех', emoji: '🌵',
      type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Получить 3 Шипа. Атакующие вас враги получают этот урон в ответ.',
      effects: [{ type: 'applySelf', status: 'thorns', value: 3 }],
      upgrade: {
        desc: 'Получить 5 Шипов. Атакующие вас враги получают этот урон в ответ.',
        effects: [{ type: 'applySelf', status: 'thorns', value: 5 }]
      }
    },

    iron_skin: {
      id: 'iron_skin', name: 'Железная кожа', emoji: '⚙️',
      type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'В конце каждого вашего хода получайте 3 блока.',
      effects: [{ type: 'applySelf', status: 'metallicize', value: 3 }],
      upgrade: {
        desc: 'В конце каждого вашего хода получайте 4 блока.',
        effects: [{ type: 'applySelf', status: 'metallicize', value: 4 }]
      }
    },

    troll_blood: {
      id: 'troll_blood', name: 'Кровь тролля', emoji: '🧌',
      type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Получить 7 Регенерации: в начале хода лечит, затем ослабевает на 1.',
      effects: [{ type: 'applySelf', status: 'regen', value: 7 }],
      upgrade: {
        desc: 'Получить 10 Регенерации: в начале хода лечит, затем ослабевает на 1.',
        effects: [{ type: 'applySelf', status: 'regen', value: 10 }]
      }
    },

    shockwave: {
      id: 'shockwave', name: 'Ударная волна', emoji: '💥',
      type: 'skill', rarity: 'uncommon', cost: 2, target: 'all',
      desc: 'Наложить 3 Слабости и 3 Уязвимости на всех врагов. Истощение.',
      exhaust: true,
      effects: [
        { type: 'applyAllEnemies', status: 'weak', value: 3 },
        { type: 'applyAllEnemies', status: 'vulnerable', value: 3 }
      ],
      upgrade: {
        desc: 'Наложить 5 Слабостей и 5 Уязвимостей на всех врагов. Истощение.',
        effects: [
          { type: 'applyAllEnemies', status: 'weak', value: 5 },
          { type: 'applyAllEnemies', status: 'vulnerable', value: 5 }
        ]
      }
    },

    uppercut: {
      id: 'uppercut', name: 'Апперкот', emoji: '👊',
      type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
      desc: 'Нанести 13 урона. Наложить 1 Слабость и 1 Уязвимость.',
      effects: [
        { type: 'damage', value: 13 },
        { type: 'applyTarget', status: 'weak', value: 1 },
        { type: 'applyTarget', status: 'vulnerable', value: 1 }
      ],
      upgrade: {
        desc: 'Нанести 13 урона. Наложить 2 Слабости и 2 Уязвимости.',
        effects: [
          { type: 'damage', value: 13 },
          { type: 'applyTarget', status: 'weak', value: 2 },
          { type: 'applyTarget', status: 'vulnerable', value: 2 }
        ]
      }
    },

    spiked_shield: {
      id: 'spiked_shield', name: 'Шипастый щит', emoji: '🦔',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Получить 8 блока и 1 Шип.',
      effects: [
        { type: 'block', value: 8 },
        { type: 'applySelf', status: 'thorns', value: 1 }
      ],
      upgrade: {
        desc: 'Получить 10 блока и 2 Шипа.',
        effects: [
          { type: 'block', value: 10 },
          { type: 'applySelf', status: 'thorns', value: 2 }
        ]
      }
    },

    burning_pact: {
      id: 'burning_pact', name: 'Огненный пакт', emoji: '🕯️',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Истощить случайную карту из руки. Взять 2 карты.',
      effects: [
        { type: 'exhaustRandomHand', value: 1 },
        { type: 'draw', value: 2 }
      ],
      upgrade: {
        desc: 'Истощить случайную карту из руки. Взять 3 карты.',
        effects: [
          { type: 'exhaustRandomHand', value: 1 },
          { type: 'draw', value: 3 }
        ]
      }
    },

    true_grit: {
      id: 'true_grit', name: 'Истинная стойкость', emoji: '🗿',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Получить 7 блока. Истощить случайную карту из руки.',
      effects: [
        { type: 'block', value: 7 },
        { type: 'exhaustRandomHand', value: 1 }
      ],
      upgrade: {
        desc: 'Получить 9 блока. Истощить случайную карту из руки.',
        effects: [
          { type: 'block', value: 9 },
          { type: 'exhaustRandomHand', value: 1 }
        ]
      }
    },

    mercy_blow: {
      id: 'mercy_blow', name: 'Удар милосердия', emoji: '⚰️',
      type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      desc: 'Нанести 8 урона. Если у цели меньше половины здоровья — урон удваивается.',
      effects: [{ type: 'special', id: 'execute', value: 8 }],
      upgrade: {
        desc: 'Нанести 11 урона. Если у цели меньше половины здоровья — урон удваивается.',
        effects: [{ type: 'special', id: 'execute', value: 11 }]
      }
    },

    seeing_red: {
      id: 'seeing_red', name: 'Багровая пелена', emoji: '🔴',
      type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Получить 2 энергии. Истощение.',
      exhaust: true,
      effects: [{ type: 'energy', value: 2 }],
      upgrade: {
        cost: 0,
        desc: 'Получить 2 энергии. Истощение.'
      }
    },

    cat_grace: {
      id: 'cat_grace', name: 'Кошачья грация', emoji: '🐈',
      type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
      desc: 'Получить 2 Ловкости.',
      effects: [{ type: 'applySelf', status: 'dexterity', value: 2 }],
      upgrade: {
        desc: 'Получить 3 Ловкости.',
        effects: [{ type: 'applySelf', status: 'dexterity', value: 3 }]
      }
    },

    // ---------------------------------------------------------------- RARE --

    dark_pact: {
      id: 'dark_pact', name: 'Тёмный договор', emoji: '😈',
      type: 'power', rarity: 'rare', cost: 3, target: 'self',
      desc: 'В конце каждого вашего хода получайте 2 Силы.',
      effects: [{ type: 'applySelf', status: 'ritual', value: 2 }],
      upgrade: {
        desc: 'В конце каждого вашего хода получайте 3 Силы.',
        effects: [{ type: 'applySelf', status: 'ritual', value: 3 }]
      }
    },

    avalanche: {
      id: 'avalanche', name: 'Каменная лавина', emoji: '🏔️',
      type: 'skill', rarity: 'rare', cost: 'X', target: 'self',
      desc: 'Получить 7 блока Х раз.',
      effects: [{ type: 'block', value: 7, times: 'X' }],
      upgrade: {
        desc: 'Получить 9 блока Х раз.',
        effects: [{ type: 'block', value: 9, times: 'X' }]
      }
    },

    offering: {
      id: 'offering', name: 'Кровавое подношение', emoji: '🫀',
      type: 'skill', rarity: 'rare', cost: 0, target: 'self',
      desc: 'Потерять 6 здоровья. Получить 2 энергии и взять 3 карты. Истощение.',
      exhaust: true,
      effects: [
        { type: 'loseHP', value: 6 },
        { type: 'energy', value: 2 },
        { type: 'draw', value: 3 }
      ],
      upgrade: {
        desc: 'Потерять 6 здоровья. Получить 2 энергии и взять 5 карт. Истощение.',
        effects: [
          { type: 'loseHP', value: 6 },
          { type: 'energy', value: 2 },
          { type: 'draw', value: 5 }
        ]
      }
    },

    doom_hammer: {
      id: 'doom_hammer', name: 'Молот рока', emoji: '⚒️',
      type: 'attack', rarity: 'rare', cost: 3, target: 'enemy',
      desc: 'Нанести 32 урона.',
      effects: [{ type: 'damage', value: 32 }],
      upgrade: {
        desc: 'Нанести 42 урона.',
        effects: [{ type: 'damage', value: 42 }]
      }
    },

    devour: {
      id: 'devour', name: 'Пожирание', emoji: '🦴',
      type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
      desc: 'Нанести 12 урона. Увеличить максимум здоровья на 3. Истощение.',
      exhaust: true,
      effects: [
        { type: 'damage', value: 12 },
        { type: 'gainMaxHP', value: 3 }
      ],
      upgrade: {
        desc: 'Нанести 16 урона. Увеличить максимум здоровья на 4. Истощение.',
        effects: [
          { type: 'damage', value: 16 },
          { type: 'gainMaxHP', value: 4 }
        ]
      }
    },

    immolate: {
      id: 'immolate', name: 'Всесожжение', emoji: '☄️',
      type: 'attack', rarity: 'rare', cost: 2, target: 'all',
      desc: 'Нанести 15 урона всем врагам. Положить Рану в сброс.',
      effects: [
        { type: 'damageAll', value: 15 },
        { type: 'addCard', card: 'wound', where: 'discard', count: 1 }
      ],
      upgrade: {
        desc: 'Нанести 20 урона всем врагам. Положить Рану в сброс.',
        effects: [
          { type: 'damageAll', value: 20 },
          { type: 'addCard', card: 'wound', where: 'discard', count: 1 }
        ]
      }
    },

    plague: {
      id: 'plague', name: 'Чума', emoji: '🦠',
      type: 'skill', rarity: 'rare', cost: 2, target: 'all',
      desc: 'Наложить 8 Яда на всех врагов.',
      effects: [{ type: 'applyAllEnemies', status: 'poison', value: 8 }],
      upgrade: {
        desc: 'Наложить 12 Яда на всех врагов.',
        effects: [{ type: 'applyAllEnemies', status: 'poison', value: 12 }]
      }
    },

    impenetrable: {
      id: 'impenetrable', name: 'Несокрушимость', emoji: '🏰',
      type: 'skill', rarity: 'rare', cost: 2, target: 'self',
      desc: 'Получить 30 блока. Истощение.',
      exhaust: true,
      effects: [{ type: 'block', value: 30 }],
      upgrade: {
        desc: 'Получить 40 блока. Истощение.',
        effects: [{ type: 'block', value: 40 }]
      }
    },

    adrenaline: {
      id: 'adrenaline', name: 'Адреналин', emoji: '💉',
      type: 'skill', rarity: 'rare', cost: 0, target: 'self',
      desc: 'Получить 1 энергию. Взять 2 карты. Истощение.',
      exhaust: true,
      effects: [
        { type: 'energy', value: 1 },
        { type: 'draw', value: 2 }
      ],
      upgrade: {
        desc: 'Получить 2 энергии. Взять 2 карты. Истощение.',
        effects: [
          { type: 'energy', value: 2 },
          { type: 'draw', value: 2 }
        ]
      }
    },

    war_banner: {
      id: 'war_banner', name: 'Знамя войны', emoji: '🚩',
      type: 'power', rarity: 'rare', cost: 2, target: 'self',
      desc: 'Получить 2 Силы и 2 Ловкости.',
      effects: [
        { type: 'applySelf', status: 'strength', value: 2 },
        { type: 'applySelf', status: 'dexterity', value: 2 }
      ],
      upgrade: {
        desc: 'Получить 3 Силы и 3 Ловкости.',
        effects: [
          { type: 'applySelf', status: 'strength', value: 3 },
          { type: 'applySelf', status: 'dexterity', value: 3 }
        ]
      }
    },

    sacrificial_blade: {
      id: 'sacrificial_blade', name: 'Клинок жертвы', emoji: '🩸',
      type: 'attack', rarity: 'rare', cost: 1, target: 'enemy',
      desc: 'Потерять 3 здоровья. Нанести 20 урона.',
      effects: [
        { type: 'loseHP', value: 3 },
        { type: 'damage', value: 20 }
      ],
      upgrade: {
        desc: 'Потерять 3 здоровья. Нанести 26 урона.',
        effects: [
          { type: 'loseHP', value: 3 },
          { type: 'damage', value: 26 }
        ]
      }
    },

    earthquake: {
      id: 'earthquake', name: 'Земной раскол', emoji: '🌋',
      type: 'attack', rarity: 'rare', cost: 3, target: 'all',
      desc: 'Нанести 12 урона всем врагам. Наложить 2 Уязвимости на всех врагов.',
      effects: [
        { type: 'damageAll', value: 12 },
        { type: 'applyAllEnemies', status: 'vulnerable', value: 2 }
      ],
      upgrade: {
        desc: 'Нанести 16 урона всем врагам. Наложить 2 Уязвимости на всех врагов.',
        effects: [
          { type: 'damageAll', value: 16 },
          { type: 'applyAllEnemies', status: 'vulnerable', value: 2 }
        ]
      }
    },

    soul_ward: {
      id: 'soul_ward', name: 'Оберег души', emoji: '🔮',
      type: 'power', rarity: 'rare', cost: 1, target: 'self',
      desc: 'Получить 2 Артефакта. Каждый заряд отражает следующий дебафф.',
      effects: [{ type: 'applySelf', status: 'artifact', value: 2 }],
      upgrade: {
        desc: 'Получить 3 Артефакта. Каждый заряд отражает следующий дебафф.',
        effects: [{ type: 'applySelf', status: 'artifact', value: 3 }]
      }
    },

    // ------------------------------------------------- СТАТУСЫ И ПРОКЛЯТИЯ --

    wound: {
      id: 'wound', name: 'Рана', emoji: '🤕',
      type: 'status', rarity: 'special', cost: 0, target: 'none',
      desc: 'Неиграема. Мёртвый груз в руке.',
      unplayable: true
    },

    dazed: {
      id: 'dazed', name: 'Оглушение', emoji: '💫',
      type: 'status', rarity: 'special', cost: 0, target: 'none',
      desc: 'Неиграема. Эфемерная: истощается в конце хода.',
      unplayable: true, ethereal: true
    },

    slimed: {
      id: 'slimed', name: 'Слизь', emoji: '🟢',
      type: 'status', rarity: 'special', cost: 1, target: 'none',
      desc: 'Липкая дрянь. Ничего не делает. Истощение.',
      exhaust: true,
      effects: []
    },

    curse_regret: {
      id: 'curse_regret', name: 'Сожаление', emoji: '😔',
      type: 'curse', rarity: 'special', cost: 0, target: 'none',
      desc: 'Неиграема. В конце хода, если в руке: потерять 1 здоровье.',
      unplayable: true,
      endTurnInHand: [{ type: 'loseHP', value: 1 }]
    },

    curse_doubt: {
      id: 'curse_doubt', name: 'Сомнение', emoji: '🌫️',
      type: 'curse', rarity: 'special', cost: 0, target: 'none',
      desc: 'Неиграема. Шёпот в голове не смолкает.',
      unplayable: true
    },

    curse_shackles: {
      id: 'curse_shackles', name: 'Оковы', emoji: '⛓️',
      type: 'curse', rarity: 'special', cost: 0, target: 'none',
      desc: 'Неиграема. В конце хода, если в руке: получить 1 Слабость.',
      unplayable: true,
      endTurnInHand: [{ type: 'applySelf', status: 'weak', value: 1 }]
    }
  };

  GAME.DATA.startingDeck = [
    'strike', 'strike', 'strike', 'strike', 'strike',
    'defend', 'defend', 'defend', 'defend',
    'battle_cry'
  ];
})();
