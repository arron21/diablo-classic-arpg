/**
 * Procedural Pixel-Art Rasterizer & Spritesheet Generator.
 * Creates authentic 90s gothic dark fantasy textures and sprites with zero external assets.
 */

export interface SpriteAtlas {
  floors: { [key: string]: HTMLCanvasElement };
  walls: { [key: string]: HTMLCanvasElement };
  props: { [key: string]: HTMLCanvasElement };
  items: { [key: string]: HTMLCanvasElement };
  warrior: { [anim: string]: HTMLCanvasElement[] };
  skeleton: { [anim: string]: HTMLCanvasElement[] };
  zombie: { [anim: string]: HTMLCanvasElement[] };
  butcher: { [anim: string]: HTMLCanvasElement[] };
}

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

/**
 * Creates an isometric diamond floor tile (64x32px).
 */
export function createFloorTile(type: 'town' | 'cathedral' | 'blood' | 'stairs_down' | 'stairs_up'): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(64, 32);

  // Diamond path
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(63, 16);
  ctx.lineTo(32, 31);
  ctx.lineTo(0, 16);
  ctx.closePath();
  ctx.clip();

  if (type === 'town') {
    // Earthen cobblestone
    ctx.fillStyle = '#2f271c';
    ctx.fillRect(0, 0, 64, 32);

    // Stone cobbles
    const stones = [
      { x: 32, y: 8, r: 6, c: '#483c2e' },
      { x: 20, y: 14, r: 5, c: '#3a3024' },
      { x: 44, y: 15, r: 6, c: '#403528' },
      { x: 32, y: 20, r: 7, c: '#4e4233' },
      { x: 12, y: 16, r: 4, c: '#352c21' },
      { x: 50, y: 18, r: 4, c: '#3e3427' }
    ];
    for (const s of stones) {
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1d1710';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (type === 'cathedral') {
    // Dark gothic cathedral flagstones
    ctx.fillStyle = '#232328';
    ctx.fillRect(0, 0, 64, 32);

    // Stone tile grooves
    ctx.strokeStyle = '#141418';
    ctx.lineWidth = 1;
    // Sub-tile lines
    ctx.beginPath();
    ctx.moveTo(16, 8);
    ctx.lineTo(47, 24);
    ctx.moveTo(47, 8);
    ctx.lineTo(16, 24);
    ctx.stroke();

    // Highlights on tile edges
    ctx.strokeStyle = '#383842';
    ctx.beginPath();
    ctx.moveTo(32, 2);
    ctx.lineTo(61, 16);
    ctx.stroke();
  } else if (type === 'blood') {
    // Catacombs blood-stained flagstone
    ctx.fillStyle = '#20181b';
    ctx.fillRect(0, 0, 64, 32);

    ctx.strokeStyle = '#140f11';
    ctx.strokeRect(10, 6, 44, 20);

    // Dried & fresh blood splatters
    ctx.fillStyle = '#4a0e14';
    ctx.beginPath();
    ctx.ellipse(28, 16, 12, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7a151e';
    ctx.beginPath();
    ctx.ellipse(32, 17, 7, 3, -0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'stairs_down') {
    // Cathedral stone with dark descending stairs cutout
    ctx.fillStyle = '#232328';
    ctx.fillRect(0, 0, 64, 32);

    // Descending steps into blackness
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(54, 17);
    ctx.lineTo(32, 28);
    ctx.lineTo(10, 17);
    ctx.closePath();
    ctx.fill();

    // Step edges
    for (let i = 0; i < 4; i++) {
      const y = 10 + i * 4;
      ctx.fillStyle = `rgb(${40 - i * 8}, ${40 - i * 8}, ${45 - i * 8})`;
      ctx.fillRect(20 + i * 3, y, 24 - i * 6, 2);
    }
  } else if (type === 'stairs_up') {
    // Ascending stairs with subtle golden light from above
    ctx.fillStyle = '#232328';
    ctx.fillRect(0, 0, 64, 32);

    // Glowing entryway
    ctx.fillStyle = '#2a2618';
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(54, 17);
    ctx.lineTo(32, 28);
    ctx.lineTo(10, 17);
    ctx.closePath();
    ctx.fill();

    // Bright daylight stone steps
    for (let i = 0; i < 4; i++) {
      const y = 22 - i * 4;
      ctx.fillStyle = `rgb(${70 + i * 20}, ${65 + i * 20}, ${45 + i * 15})`;
      ctx.fillRect(16 + i * 4, y, 32 - i * 8, 2);
    }
  }

  // Border outline to give crisp isometric tile definition
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(63, 16);
  ctx.lineTo(32, 31);
  ctx.lineTo(0, 16);
  ctx.closePath();
  ctx.stroke();

  return canvas;
}

/**
 * Creates an isometric wall sprite (64x80px).
 * In 2.5D, an isometric wall stands atop a 64x32 tile and rises 48px vertically.
 */
export function createWallTile(variant: 'cathedral' | 'blood' | 'door_closed' | 'door_open'): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(64, 80);

  const baseColor = variant === 'blood' ? '#2d2224' : '#323238';
  const shadowColor = variant === 'blood' ? '#181213' : '#1b1b20';
  const highlightColor = variant === 'blood' ? '#4a383b' : '#4a4a54';
  const mortarColor = '#101014';

  // South-facing left facet: polygon (32, 16) to (0, 32) to (0, 80) to (32, 64) offset vertically
  // Isometric block:
  // Top diamond: (32, 0), (64, 16), (32, 32), (0, 16)
  // Left face: (0, 16), (32, 32), (32, 80), (0, 64)
  // Right face: (32, 32), (64, 16), (64, 64), (32, 80)

  // Top surface
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(64, 16);
  ctx.lineTo(32, 32);
  ctx.lineTo(0, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a0a0c';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left vertical face (lit side)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(32, 32);
  ctx.lineTo(32, 80);
  ctx.lineTo(0, 64);
  ctx.closePath();
  ctx.fill();

  // Right vertical face (shadowed side)
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(64, 16);
  ctx.lineTo(64, 64);
  ctx.lineTo(32, 80);
  ctx.closePath();
  ctx.fill();

  // Brick masonry patterns on left face
  ctx.strokeStyle = mortarColor;
  ctx.lineWidth = 1;
  for (let y = 28; y < 76; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(32, y + 16);
    ctx.stroke();
  }
  // Vertical brick lines
  ctx.beginPath();
  ctx.moveTo(16, 36); ctx.lineTo(16, 48);
  ctx.moveTo(10, 52); ctx.lineTo(10, 64);
  ctx.moveTo(22, 58); ctx.lineTo(22, 70);
  ctx.stroke();

  // Brick lines on right face
  for (let y = 28; y < 76; y += 12) {
    ctx.beginPath();
    ctx.moveTo(32, y + 16);
    ctx.lineTo(64, y);
    ctx.stroke();
  }

  if (variant === 'blood') {
    // Blood drips from wall
    ctx.fillStyle = '#680c14';
    ctx.fillRect(14, 44, 4, 18);
    ctx.fillRect(18, 52, 3, 16);
    ctx.fillRect(40, 48, 3, 14);
  } else if (variant === 'door_closed') {
    // Wooden door inset on left face
    ctx.fillStyle = '#4a2d16';
    ctx.beginPath();
    ctx.moveTo(6, 30);
    ctx.lineTo(26, 40);
    ctx.lineTo(26, 75);
    ctx.lineTo(6, 65);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#251508';
    ctx.stroke();

    // Iron reinforcement bands
    ctx.fillStyle = '#1c1c1f';
    ctx.fillRect(6, 40, 20, 3);
    ctx.fillRect(6, 58, 20, 3);
    // Iron ring handle
    ctx.fillStyle = '#7a6a4a';
    ctx.fillRect(20, 50, 3, 4);
  } else if (variant === 'door_open') {
    // Open door: dark portal opening
    ctx.fillStyle = '#08080a';
    ctx.beginPath();
    ctx.moveTo(6, 30);
    ctx.lineTo(26, 40);
    ctx.lineTo(26, 75);
    ctx.lineTo(6, 65);
    ctx.closePath();
    ctx.fill();

    // Door swung open inwards
    ctx.fillStyle = '#3a2210';
    ctx.beginPath();
    ctx.moveTo(26, 40);
    ctx.lineTo(31, 38);
    ctx.lineTo(31, 73);
    ctx.lineTo(26, 75);
    ctx.closePath();
    ctx.fill();
  }

  // Edge outline
  ctx.strokeStyle = '#050506';
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(64, 16);
  ctx.lineTo(64, 64);
  ctx.lineTo(32, 80);
  ctx.lineTo(0, 64);
  ctx.lineTo(0, 16);
  ctx.closePath();
  ctx.stroke();

  return canvas;
}

/**
 * Creates interactive props (barrels, chests, shrines, torches).
 */
export function createPropSprite(type: 'barrel' | 'chest_closed' | 'chest_open' | 'torch' | 'pillar'): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(48, 48);

  if (type === 'barrel') {
    // Wooden barrel
    ctx.fillStyle = '#5c3a1e';
    ctx.beginPath();
    ctx.ellipse(24, 28, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iron bands
    ctx.strokeStyle = '#222226';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24, 22, 11, 0.2, Math.PI - 0.2);
    ctx.arc(24, 34, 11, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Top lid
    ctx.fillStyle = '#3f2714';
    ctx.beginPath();
    ctx.ellipse(24, 16, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'chest_closed') {
    // Ornate wooden & brass chest
    ctx.fillStyle = '#4e331b';
    ctx.fillRect(12, 22, 24, 14);
    // Rounded lid
    ctx.fillStyle = '#694524';
    ctx.beginPath();
    ctx.ellipse(24, 22, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Gold/brass lock and rims
    ctx.fillStyle = '#c8a232';
    ctx.fillRect(11, 20, 3, 16);
    ctx.fillRect(34, 20, 3, 16);
    ctx.fillRect(22, 24, 4, 6);
    ctx.strokeStyle = '#181008';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 22, 24, 14);
  } else if (type === 'chest_open') {
    // Open chest with golden gleam
    ctx.fillStyle = '#2f1f10';
    ctx.fillRect(12, 24, 24, 12);
    // Open lid tilted back
    ctx.fillStyle = '#5c3b1e';
    ctx.beginPath();
    ctx.ellipse(24, 15, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Jewels/gold inside
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(16, 26, 16, 5);
    ctx.fillStyle = '#e60000';
    ctx.fillRect(20, 27, 3, 3);
  } else if (type === 'torch') {
    // Wall sconce with flickering flame
    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(22, 20, 4, 16);
    // Wood torch head
    ctx.fillStyle = '#4a2e16';
    ctx.fillRect(20, 14, 8, 6);
    // Flame
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.ellipse(24, 10, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(24, 11, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'pillar') {
    // Carved gothic stone pillar
    ctx.fillStyle = '#2c2c34';
    ctx.fillRect(18, 10, 12, 32);
    // Base & capital
    ctx.fillStyle = '#42424e';
    ctx.fillRect(14, 8, 20, 4);
    ctx.fillRect(14, 40, 20, 4);
    // Highlights & shadow
    ctx.fillStyle = '#585868';
    ctx.fillRect(18, 10, 3, 30);
    ctx.fillStyle = '#181820';
    ctx.fillRect(27, 10, 3, 30);
  }

  return canvas;
}

/**
 * Creates 32x32 inventory item icons.
 */
export function createItemIcon(type: string): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(32, 32);

  // Background subtle slot
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, 32, 32);

  switch (type) {
    case 'sword':
      // Broad sword
      ctx.strokeStyle = '#c8d0d8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 24); ctx.lineTo(24, 8);
      ctx.stroke();
      // Guard & Pommel
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 18); ctx.lineTo(14, 26);
      ctx.stroke();
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(6, 24, 3, 3);
      break;

    case 'axe':
      // Battle axe
      ctx.strokeStyle = '#6b4c2b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 26); ctx.lineTo(24, 8);
      ctx.stroke();
      // Double blade
      ctx.fillStyle = '#9aa4b0';
      ctx.beginPath();
      ctx.arc(20, 12, 8, -Math.PI / 4, Math.PI / 1.8);
      ctx.fill();
      ctx.strokeStyle = '#d4d8de';
      ctx.stroke();
      break;

    case 'shield':
      // Kite / Heater Shield
      ctx.fillStyle = '#3a4454';
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(24, 6);
      ctx.lineTo(22, 20);
      ctx.lineTo(16, 28);
      ctx.lineTo(10, 20);
      ctx.closePath();
      ctx.fill();
      // Gold trim & cross
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#a82424';
      ctx.fillRect(15, 8, 2, 16);
      ctx.fillRect(10, 12, 12, 2);
      break;

    case 'armor':
      // Full Plate Mail
      ctx.fillStyle = '#5c6470';
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(24, 6);
      ctx.lineTo(26, 14);
      ctx.lineTo(22, 26);
      ctx.lineTo(10, 26);
      ctx.lineTo(6, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9da8b6';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Pauldrons
      ctx.fillStyle = '#828e9c';
      ctx.fillRect(6, 7, 6, 6);
      ctx.fillRect(20, 7, 6, 6);
      break;

    case 'helm':
      // Great Helm
      ctx.fillStyle = '#6b7482';
      ctx.beginPath();
      ctx.moveTo(9, 8);
      ctx.lineTo(23, 8);
      ctx.lineTo(24, 22);
      ctx.lineTo(8, 22);
      ctx.closePath();
      ctx.fill();
      // Eye slits (T-shape visor)
      ctx.fillStyle = '#101014';
      ctx.fillRect(11, 14, 10, 2);
      ctx.fillRect(15, 12, 2, 8);
      break;

    case 'potion_health':
      // Round glass vial with crimson liquid
      ctx.fillStyle = 'rgba(200, 220, 240, 0.4)';
      ctx.beginPath();
      ctx.arc(16, 18, 9, 0, Math.PI * 2);
      ctx.fill();
      // Liquid
      ctx.fillStyle = '#c41424';
      ctx.beginPath();
      ctx.arc(16, 19, 7.5, 0, Math.PI);
      ctx.fill();
      // Cork
      ctx.fillStyle = '#8c5827';
      ctx.fillRect(14, 6, 4, 4);
      // Glass highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 14, 2, 4);
      break;

    case 'potion_mana':
      // Blue mana flask
      ctx.fillStyle = 'rgba(200, 220, 240, 0.4)';
      ctx.beginPath();
      ctx.arc(16, 18, 9, 0, Math.PI * 2);
      ctx.fill();
      // Liquid
      ctx.fillStyle = '#1a56d6';
      ctx.beginPath();
      ctx.arc(16, 19, 7.5, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#8c5827';
      ctx.fillRect(14, 6, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 14, 2, 4);
      break;

    case 'scroll_portal':
      // Parchment tied with blue ribbon
      ctx.fillStyle = '#e8d8b0';
      ctx.fillRect(8, 12, 16, 8);
      ctx.strokeStyle = '#aa9870';
      ctx.strokeRect(8, 12, 16, 8);
      ctx.fillStyle = '#1a56d6';
      ctx.fillRect(15, 10, 3, 12);
      break;

    case 'scroll_identify':
      // Parchment with red ribbon
      ctx.fillStyle = '#e8d8b0';
      ctx.fillRect(8, 12, 16, 8);
      ctx.strokeStyle = '#aa9870';
      ctx.strokeRect(8, 12, 16, 8);
      ctx.fillStyle = '#c41424';
      ctx.fillRect(15, 10, 3, 12);
      break;

    case 'cleaver':
      // The Butcher's Cleaver (massive blood-stained meat cleaver)
      ctx.fillStyle = '#6b4c2b';
      ctx.fillRect(6, 20, 6, 4);
      // Heavy blade
      ctx.fillStyle = '#8b94a0';
      ctx.fillRect(12, 8, 14, 18);
      // Sharp edge
      ctx.fillStyle = '#d0d8e2';
      ctx.fillRect(24, 7, 3, 20);
      // Blood spatter
      ctx.fillStyle = '#8a0a14';
      ctx.fillRect(18, 14, 8, 10);
      ctx.fillRect(22, 10, 4, 8);
      break;

    case 'gold':
      // Gold coins pile
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.ellipse(14, 20, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(19, 18, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(16, 15, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b89000';
      ctx.stroke();
      break;

    default:
      // Generic amulet/ring
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#c41424';
      ctx.fillRect(15, 15, 3, 3);
      break;
  }

  return canvas;
}

/**
 * Character Sprite Generators (Warrior, Skeleton, Zombie, Butcher).
 * Generates directional frames (48x56px) for Idle, Walk, Attack, and Hit/Death.
 */
export function createCharacterFrames(characterType: 'warrior' | 'skeleton' | 'zombie' | 'butcher'): { [state: string]: HTMLCanvasElement[] } {
  const result: { [state: string]: HTMLCanvasElement[] } = {
    idle: [],
    walk: [],
    attack: [],
    hit: [],
    dead: []
  };

  const W = 48;
  const H = 56;

  // Generate 4 animation frames per state
  for (let f = 0; f < 4; f++) {
    // Idle
    const [cIdle, ctxIdle] = createCanvas(W, H);
    drawCharacter(ctxIdle, characterType, 'idle', f, W, H);
    result.idle.push(cIdle);

    // Walk
    const [cWalk, ctxWalk] = createCanvas(W, H);
    drawCharacter(ctxWalk, characterType, 'walk', f, W, H);
    result.walk.push(cWalk);

    // Attack
    const [cAtk, ctxAtk] = createCanvas(W, H);
    drawCharacter(ctxAtk, characterType, 'attack', f, W, H);
    result.attack.push(cAtk);
  }

  // Hit frame
  const [cHit, ctxHit] = createCanvas(W, H);
  drawCharacter(ctxHit, characterType, 'hit', 0, W, H);
  result.hit.push(cHit);

  // Dead frame
  const [cDead, ctxDead] = createCanvas(W, H);
  drawCharacter(ctxDead, characterType, 'dead', 0, W, H);
  result.dead.push(cDead);

  return result;
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  type: 'warrior' | 'skeleton' | 'zombie' | 'butcher',
  anim: 'idle' | 'walk' | 'attack' | 'hit' | 'dead',
  frame: number,
  W: number,
  H: number
) {
  const cx = W / 2;
  const cy = H - 12;

  // Ground shadow
  if (anim !== 'dead') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, type === 'butcher' ? 16 : 10, type === 'butcher' ? 7 : 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (anim === 'dead') {
    // Corpse lying on ground
    ctx.fillStyle = type === 'butcher' ? '#5a1216' : type === 'skeleton' ? '#c8c8b4' : '#2f3830';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, type === 'butcher' ? 18 : 12, type === 'butcher' ? 8 : 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Blood pool
    ctx.fillStyle = '#6a0a12';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const bounce = anim === 'walk' ? (frame % 2 === 0 ? 0 : -2) : 0;
  const swing = anim === 'attack' ? frame * 6 : 0;
  const hitShake = anim === 'hit' ? -3 : 0;

  if (type === 'warrior') {
    // Warrior: Horned helmet, blue/steel tunic, broadsword, shield
    const yOff = cy - 24 + bounce + hitShake;

    // Legs
    ctx.fillStyle = '#2d3340';
    const legOffset = anim === 'walk' ? (frame % 2 === 0 ? 3 : -3) : 0;
    ctx.fillRect(cx - 5 + legOffset, yOff + 14, 4, 10);
    ctx.fillRect(cx + 2 - legOffset, yOff + 14, 4, 10);

    // Body (chainmail & blue tunic)
    ctx.fillStyle = '#1c3d70';
    ctx.fillRect(cx - 7, yOff, 14, 14);
    ctx.fillStyle = '#5a6b82'; // mail chest
    ctx.fillRect(cx - 5, yOff + 2, 10, 9);

    // Head & Horned Great Helm
    ctx.fillStyle = '#7a889b';
    ctx.fillRect(cx - 5, yOff - 10, 10, 10);
    // Visor slit
    ctx.fillStyle = '#10141a';
    ctx.fillRect(cx - 3, yOff - 6, 6, 2);
    // Horns
    ctx.fillStyle = '#dcd2b0';
    ctx.fillRect(cx - 8, yOff - 12, 3, 5);
    ctx.fillRect(cx + 5, yOff - 12, 3, 5);

    // Shield (Left hand)
    ctx.fillStyle = '#7a421a';
    ctx.fillRect(cx - 13, yOff + 2, 6, 12);
    ctx.strokeStyle = '#b89000';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 13, yOff + 2, 6, 12);

    // Sword (Right hand)
    ctx.save();
    ctx.translate(cx + 8, yOff + 6);
    ctx.rotate((swing * Math.PI) / 180);
    ctx.fillStyle = '#d6e0ea';
    ctx.fillRect(0, -14, 3, 16);
    ctx.fillStyle = '#ffd700'; // Hilt
    ctx.fillRect(-2, 0, 7, 2);
    ctx.restore();

  } else if (type === 'skeleton') {
    // Skeleton: Bone white, ribcage, red eyes
    const yOff = cy - 22 + bounce + hitShake;

    // Legs (thin bone)
    ctx.fillStyle = '#c8c8b4';
    ctx.fillRect(cx - 4, yOff + 14, 2, 9);
    ctx.fillRect(cx + 2, yOff + 14, 2, 9);

    // Ribcage & spine
    ctx.fillStyle = '#d8d8c6';
    ctx.fillRect(cx - 5, yOff, 10, 12);
    ctx.fillStyle = '#141414'; // rib gaps
    ctx.fillRect(cx - 4, yOff + 3, 8, 2);
    ctx.fillRect(cx - 4, yOff + 7, 8, 2);

    // Skull
    ctx.fillStyle = '#e4e4d4';
    ctx.fillRect(cx - 4, yOff - 9, 8, 8);
    // Glowing red eye sockets
    ctx.fillStyle = '#ff1a1a';
    ctx.fillRect(cx - 2, yOff - 6, 2, 2);
    ctx.fillRect(cx + 1, yOff - 6, 2, 2);

    // Rusted scimitar
    ctx.save();
    ctx.translate(cx + 7, yOff + 4);
    ctx.rotate((swing * Math.PI) / 180);
    ctx.fillStyle = '#8b6946';
    ctx.fillRect(0, -12, 3, 14);
    ctx.restore();

  } else if (type === 'zombie') {
    // Zombie: Shambling rotting flesh, outstretched arms
    const yOff = cy - 22 + bounce + hitShake;

    ctx.fillStyle = '#222820'; // tattered trousers
    ctx.fillRect(cx - 5, yOff + 14, 4, 9);
    ctx.fillRect(cx + 2, yOff + 14, 4, 9);

    // Rotting torso
    ctx.fillStyle = '#3a4e38';
    ctx.fillRect(cx - 6, yOff, 12, 14);

    // Head
    ctx.fillStyle = '#4c6448';
    ctx.fillRect(cx - 4, yOff - 9, 8, 8);
    ctx.fillStyle = '#182016'; // hollow eyes
    ctx.fillRect(cx - 2, yOff - 6, 2, 2);
    ctx.fillRect(cx + 1, yOff - 6, 2, 2);

    // Outstretched decaying arms
    ctx.fillStyle = '#4c6448';
    ctx.fillRect(cx + 4, yOff + 3 + swing * 0.5, 8, 3);

  } else if (type === 'butcher') {
    // The Butcher: Massive ogre, leather apron, huge bloody cleaver
    const yOff = cy - 32 + bounce + hitShake;

    // Massive legs
    ctx.fillStyle = '#422416';
    ctx.fillRect(cx - 8, yOff + 22, 6, 12);
    ctx.fillRect(cx + 2, yOff + 22, 6, 12);

    // Massive hulking body
    ctx.fillStyle = '#8f4b36'; // raw hulking skin
    ctx.fillRect(cx - 12, yOff, 24, 22);

    // Bloody leather apron
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(cx - 9, yOff + 4, 18, 18);
    // Blood stains
    ctx.fillStyle = '#7a0a14';
    ctx.fillRect(cx - 6, yOff + 8, 12, 10);
    ctx.fillRect(cx - 4, yOff + 14, 8, 6);

    // Bald scarred head with demon eyes
    ctx.fillStyle = '#9e5640';
    ctx.fillRect(cx - 7, yOff - 12, 14, 12);
    ctx.fillStyle = '#ffff00'; // piercing yellow eyes
    ctx.fillRect(cx - 4, yOff - 8, 3, 2);
    ctx.fillRect(cx + 1, yOff - 8, 3, 2);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(cx - 3, yOff - 8, 1, 2);
    ctx.fillRect(cx + 2, yOff - 8, 1, 2);

    // Massive Meat Cleaver
    ctx.save();
    ctx.translate(cx + 12, yOff + 10);
    ctx.rotate((swing * Math.PI) / 140);
    ctx.fillStyle = '#5c3a1e'; // handle
    ctx.fillRect(0, 0, 4, 8);
    // Blade
    ctx.fillStyle = '#9aa4b0';
    ctx.fillRect(2, -18, 14, 20);
    ctx.fillStyle = '#d4dce8';
    ctx.fillRect(14, -19, 3, 22);
    // Dripping blood
    ctx.fillStyle = '#9a0c16';
    ctx.fillRect(8, -12, 8, 14);
    ctx.restore();
  }
}

/**
 * Initializes and caches the entire retro sprite atlas for instant 60fps rendering.
 */
let cachedAtlas: SpriteAtlas | null = null;

export function getSpriteAtlas(): SpriteAtlas {
  if (cachedAtlas) return cachedAtlas;

  cachedAtlas = {
    floors: {
      town: createFloorTile('town'),
      cathedral: createFloorTile('cathedral'),
      blood: createFloorTile('blood'),
      stairs_down: createFloorTile('stairs_down'),
      stairs_up: createFloorTile('stairs_up')
    },
    walls: {
      cathedral: createWallTile('cathedral'),
      blood: createWallTile('blood'),
      door_closed: createWallTile('door_closed'),
      door_open: createWallTile('door_open')
    },
    props: {
      barrel: createPropSprite('barrel'),
      chest_closed: createPropSprite('chest_closed'),
      chest_open: createPropSprite('chest_open'),
      torch: createPropSprite('torch'),
      pillar: createPropSprite('pillar')
    },
    items: {
      sword: createItemIcon('sword'),
      axe: createItemIcon('axe'),
      shield: createItemIcon('shield'),
      armor: createItemIcon('armor'),
      helm: createItemIcon('helm'),
      potion_health: createItemIcon('potion_health'),
      potion_mana: createItemIcon('potion_mana'),
      scroll_portal: createItemIcon('scroll_portal'),
      scroll_identify: createItemIcon('scroll_identify'),
      cleaver: createItemIcon('cleaver'),
      gold: createItemIcon('gold')
    },
    warrior: createCharacterFrames('warrior'),
    skeleton: createCharacterFrames('skeleton'),
    zombie: createCharacterFrames('zombie'),
    butcher: createCharacterFrames('butcher')
  };

  return cachedAtlas;
}
