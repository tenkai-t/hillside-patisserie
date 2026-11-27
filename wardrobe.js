export const characters = {
  patty: {
    name: 'パティ（公式）',
    outfit: 'patisserie', hairstyle: 'buns', hairColor: 'rose', eyeColor: 'blue',
  },
  festival: {
    name: '夏祭りの子（公式）',
    outfit: 'yukata', hairstyle: 'sideUpdo', hairColor: 'chestnut', eyeColor: 'brown',
  },
  original: {
    name: 'オリジナル',
    outfit: 'garden', hairstyle: 'bob', hairColor: 'ash', eyeColor: 'green',
  },
};

export const outfits = {
  patisserie: {
    name: 'パティの制服',
    description: '原画のリボンとフリル付きエプロン',
    main: '#593640', dark: '#482936', accent: '#cc7992', light: '#ffead3',
  },
  garden: {
    name: '花の広場',
    description: 'セージ色のワンピースと明るいエプロン',
    main: '#66816b', dark: '#ebd8bb', accent: '#96ab80', light: '#fff1d8',
  },
  yukata: {
    name: '赤い千鳥の浴衣',
    description: '千鳥と波の模様に、紺の帯と赤い組紐',
    main: '#bc504b', dark: '#29334e', accent: '#cf574c', light: '#fff0de',
  },
  evening: {
    name: '夕暮れの散歩',
    description: '藍色のワンピースと金色のリボン',
    main: '#404b70', dark: '#303449', accent: '#e6b979', light: '#e8e5f2',
  },
};

export const hairstyles = {
  buns: {name: 'おだんご'},
  bob: {name: 'ボブ'},
  ponytail: {name: 'ポニーテール'},
  sideUpdo: {name: '横まとめ髪'},
};

export const hairColors = {
  rose: {name: 'ローズ', base: '#a96e89', shade: '#87536d', shine: '#cb95aa'},
  chestnut: {name: '栗色', base: '#825846', shade: '#624033', shine: '#bc8a6e'},
  ash: {name: 'アッシュ', base: '#6c687f', shade: '#4f4a62', shine: '#9996b2'},
  honey: {name: 'はちみつ', base: '#bd895a', shade: '#89643f', shine: '#e6bc83'},
};

export const eyeColors = {
  blue: {name: '空色', base: '#5a789c', shine: '#8ebad2'},
  brown: {name: '琥珀', base: '#975e3e', shine: '#d8a777'},
  green: {name: '若葉', base: '#577c68', shine: '#93b990'},
};

export const wardrobeFields = {
  outfit: outfits,
  hairstyle: hairstyles,
  hairColor: hairColors,
  eyeColor: eyeColors,
};

export function characterAppearance(character) {
  const {outfit, hairstyle, hairColor, eyeColor} = characters[character];
  return {character, outfit, hairstyle, hairColor, eyeColor};
}

export const defaultAppearance = Object.freeze(characterAppearance('patty'));

const appearanceKey = 'hillside-patisserie.appearance.v1';
const fieldNames = Object.keys(wardrobeFields);

function playerId(value) {
  return typeof value === 'string' && Object.hasOwn(characters, value) ? value : 'patty';
}

function validChoices(value, defaults) {
  return Object.fromEntries(fieldNames.map(field => {
    const choice = value?.[field];
    return [field, typeof choice === 'string' && Object.hasOwn(wardrobeFields[field], choice)
      ? choice : defaults[field]];
  }));
}

function originalAppearance(value) {
  return {character: 'original', ...validChoices(value, characters.original)};
}

export function normalizeAppearance(value) {
  const character = playerId(value?.character);
  return character === 'original' ? originalAppearance(value) : characterAppearance(character);
}

function readWardrobe() {
  try {
    const saved = JSON.parse(localStorage.getItem(appearanceKey));
    const character = playerId(saved?.character);
    if (saved?.version === 2) {
      return {character, original: originalAppearance(saved.original)};
    }

    // An older save could customize an official character. Keep those choices
    // in the original slot and restore the official character's own design.
    const oldChoices = validChoices(saved, characters[character]);
    if (fieldNames.some(field => oldChoices[field] !== characters[character][field])) {
      return {character: 'original', original: originalAppearance(oldChoices)};
    }
    return {character, original: originalAppearance()};
  } catch {
    return {character: defaultAppearance.character, original: originalAppearance()};
  }
}

export function loadAppearance() {
  const {character, original} = readWardrobe();
  return character === 'original' ? original : characterAppearance(character);
}

export function loadOriginalAppearance() {
  return readWardrobe().original;
}

export function saveAppearance(value) {
  const appearance = normalizeAppearance(value);
  const {character} = appearance;
  const original = character === 'original' ? appearance : loadOriginalAppearance();
  localStorage.setItem(appearanceKey, JSON.stringify({version: 2, character, original}));
  return appearance;
}
