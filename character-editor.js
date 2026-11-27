import * as T from './vendor/three.module.min.js';
import {buildPlayer, disposePlayer} from './model.js?v=8';
import {characterAppearance, characters, loadOriginalAppearance, outfits, saveAppearance, wardrobeFields} from './wardrobe.js?v=8';

function createPreview(canvas) {
  const renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: true});
  renderer.setSize(288, 336, false);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 288 / 336, .1, 20);
  camera.position.set(.15, 1.16, 3.95);
  camera.lookAt(0, .96, 0);
  const light = new T.DirectionalLight('#fff0db', 1.75);
  light.position.set(3, 5, 4);
  scene.add(new T.HemisphereLight('#f0f9ff', '#ac8180', 1.61), light);

  let model;
  return (appearance, rear, changed) => {
    if (changed || !model) {
      if (model) disposePlayer(model);
      model = buildPlayer(scene, appearance);
      model.tray.visible = false;
      if (appearance.character !== 'festival') model.arms[0].fore.rotation.x = -.17;
      model.arms[1].fore.rotation.x = -.17;
    }
    model.root.rotation.y = rear ? Math.PI - .2 : -.2;
    renderer.render(scene, camera);
  };
}

export function createCharacterEditor(onSave) {
  const form = document.getElementById('appearance-form');
  const canvas = document.getElementById('appearance-preview');
  const turn = document.getElementById('preview-turn');
  const saveError = document.getElementById('save-error');
  const officialDesign = document.getElementById('official-design');
  const customFields = document.getElementById('custom-fields');
  const reset = document.getElementById('appearance-reset');
  const submit = document.getElementById('appearance-submit');
  const character = form.elements.namedItem('character');
  for (const [id, option] of Object.entries(characters)) {
    character.add(new Option(option.name, id));
  }
  const selects = Object.entries(wardrobeFields).map(([name, options]) => {
    const select = form.elements.namedItem(name);
    for (const [id, option] of Object.entries(options)) {
      select.add(new Option(option.name, id));
    }
    return select;
  });

  let rear = false;
  let renderPreview;
  let draftOriginal;
  const current = () => character.value === 'original'
    ? {character: 'original', ...Object.fromEntries(selects.map(select => [select.name, select.value]))}
    : characterAppearance(character.value);

  function showPreview(changed = true) {
    const appearance = current();
    const original = appearance.character === 'original';
    const outfit = outfits[appearance.outfit];
    document.getElementById('outfit-description').textContent = outfit.description;
    const labels = [characters[appearance.character].name];
    if (original) labels.push(...selects.map(select => wardrobeFields[select.name][select.value].name));
    canvas.setAttribute('aria-label', ['3Dプレビュー', ...labels, rear ? '後ろ姿' : '正面'].join('、'));
    turn.textContent = rear ? '正面を見る' : '後ろを見る';
    renderPreview?.(appearance, rear, changed);
  }

  function setChoices(appearance) {
    character.value = appearance.character;
    const original = appearance.character === 'original';
    customFields.hidden = customFields.disabled = !original;
    officialDesign.hidden = original;
    reset.hidden = !original;
    submit.textContent = original ? '保存してこのキャラで遊ぶ' : 'このキャラで遊ぶ';
    for (const select of selects) select.value = appearance[select.name];
    saveError.hidden = true;
    showPreview();
  }

  form.addEventListener('change', event => {
    if (event.target === character) {
      setChoices(character.value === 'original' ? draftOriginal : characterAppearance(character.value));
      return;
    }
    if (character.value === 'original') draftOriginal = current();
    showPreview();
  });
  turn.addEventListener('click', () => {
    rear = !rear;
    showPreview(false);
  });
  reset.addEventListener('click', () => {
    draftOriginal = characterAppearance('original');
    setChoices(draftOriginal);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    let saved;
    try {
      saved = saveAppearance(current());
    } catch {
      saveError.hidden = false;
      return;
    }
    onSave(saved);
  });

  return appearance => {
    if (!renderPreview && !canvas.hidden) {
      try {
        renderPreview = createPreview(canvas);
      } catch {
        canvas.hidden = turn.hidden = true;
        document.getElementById('preview-error').hidden = false;
      }
    }
    rear = false;
    draftOriginal = appearance.character === 'original' ? appearance : loadOriginalAppearance();
    setChoices(appearance);
  };
}
