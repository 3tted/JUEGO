// Nuclear Throne Exact Pixel Sprites & Drawing Helpers
// Matches the provided screenshot 1:1:
// - Duck Mutant with Katana / Revolver
// - Desert Bandits with rifles
// - Radioactive Scorpion
// - Maggot Bone Carcass
// - Saguaro & Barrel Cacti
// - Explosives Chest & Rad Canister
// - 4-Bracket Crosshair

export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  outlineColor: string = '#000000'
) {
  ctx.fillStyle = outlineColor;
  ctx.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, Math.floor(w) + 2, Math.floor(h) + 2);
  ctx.fillStyle = fillColor;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

// 1. DUCK MUTANT PROTAGONIST (with Katana / sword as seen in image)
export function drawDuckPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  walkCycle: number,
  isMoving: boolean,
  isSwinging: boolean,
  swingProgress: number
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  const bob = isMoving ? Math.sin(walkCycle * 12) * 1.5 : 0;
  const isFacingLeft = Math.cos(angle) < 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(-7, 7, 14, 3);

  ctx.translate(0, Math.floor(bob));

  // Katana / Sword (white blade, grey center, black outline, pointing up/swinging)
  ctx.save();
  let swordAngle = angle - Math.PI / 4;
  if (isSwinging) {
    swordAngle += Math.sin(swingProgress * Math.PI) * 1.8;
  }
  ctx.rotate(swordAngle);
  ctx.translate(2, -10);

  // Sword outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-3, -20, 6, 24);
  ctx.fillRect(-5, 0, 10, 4); // crossguard

  // Blade (bright white / metallic silver)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2, -19, 4, 20);
  ctx.fillStyle = '#cbd5e0';
  ctx.fillRect(0, -19, 2, 20);

  // Handle
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-2, 1, 4, 5);
  ctx.restore();

  // Character Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-8, -10, 16, 17);
  ctx.fillRect(-10, -7, 20, 12);

  // Red Cap / Bandana with white rim
  ctx.fillStyle = '#d02020';
  ctx.fillRect(-7, -9, 14, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-7, -4, 14, 2);

  // Duck Face & Beak (Yellow #ffcc00 / #f6e05e)
  ctx.fillStyle = '#f6e05e';
  ctx.fillRect(-7, -2, 14, 6);
  // Beak tip
  const beakX = isFacingLeft ? -9 : 3;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(beakX, 0, 6, 4);

  // Black Eye / White Pupil
  const eyeX = isFacingLeft ? -4 : 1;
  ctx.fillStyle = '#000000';
  ctx.fillRect(eyeX, -3, 3, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(eyeX + 1, -3, 1, 1);

  // Body Vest (Dark charcoal / khaki)
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(-6, 4, 12, 5);

  // Feet
  const legOffset = isMoving ? Math.sin(walkCycle * 12) * 2 : 0;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-5 + legOffset, 9, 3, 3);
  ctx.fillRect(2 - legOffset, 9, 3, 3);

  ctx.restore();
}

// 2. DESERT BANDIT (Hooded raider with goggles & rifle from screenshot)
export function drawBandit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  walkCycle: number = 0,
  isAlert: boolean = false
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(-6, 6, 12, 3);

  const isFacingLeft = Math.cos(angle) < 0;

  // Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-7, -9, 14, 15);
  ctx.fillRect(-8, -7, 16, 11);

  // Tan / Beige Desert Hood (#b59e74)
  ctx.fillStyle = isAlert ? '#c53030' : '#b59e74';
  ctx.fillRect(-6, -8, 12, 7);

  // Goggles / Dark Visor with glowing cyan/green eye
  ctx.fillStyle = '#171923';
  const goggleX = isFacingLeft ? -5 : 0;
  ctx.fillRect(goggleX, -5, 5, 3);
  ctx.fillStyle = isAlert ? '#ff0000' : '#48bb78';
  ctx.fillRect(goggleX + 1, -4, 3, 2);

  // Mask / Lower Face (#8c734b)
  ctx.fillStyle = '#8c734b';
  ctx.fillRect(-6, -1, 12, 4);

  // Body / Rags
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(-5, 3, 10, 4);

  // Gun in Hands
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#000000';
  ctx.fillRect(4, -2, 10, 4);
  ctx.fillStyle = '#718096';
  ctx.fillRect(5, -1, 8, 2);
  ctx.restore();

  ctx.restore();
}

// 3. RADIOACTIVE SCORPION (Giant purple/black mutant with stinger tail)
export function drawScorpion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  walkCycle: number = 0
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(-12, 8, 24, 6);

  // Black Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-11, -9, 22, 18);
  ctx.fillRect(-13, -7, 26, 14);

  // Chitin Shell (Deep purple / metallic black: #3c2448)
  ctx.fillStyle = '#321c3d';
  ctx.fillRect(-10, -7, 20, 14);
  ctx.fillStyle = '#4a2b58';
  ctx.fillRect(-8, -5, 16, 10);

  // Glowing Red Compound Eyes
  ctx.fillStyle = '#ff2020';
  ctx.fillRect(-5, -3, 3, 2);
  ctx.fillRect(2, -3, 3, 2);

  // Curved Stinger Tail (reaching overhead)
  ctx.fillStyle = '#000000';
  ctx.fillRect(6, -15, 6, 8);
  ctx.fillRect(9, -19, 5, 5);
  ctx.fillStyle = '#4a2b58';
  ctx.fillRect(7, -14, 4, 6);
  // Red Stinger Tip
  ctx.fillStyle = '#ff2020';
  ctx.fillRect(10, -18, 3, 3);

  // Legs / Claws
  ctx.fillStyle = '#000000';
  ctx.fillRect(-13, 2, 4, 5);
  ctx.fillRect(9, 2, 4, 5);
  ctx.fillStyle = '#4a2b58';
  ctx.fillRect(-12, 3, 2, 3);
  ctx.fillRect(10, 3, 2, 3);

  ctx.restore();
}

// 4. MAGGOT BONE CARCASS (Ribcage mound from screenshot)
export function drawBoneCarcass(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Mound of decayed dirt / gore (#442218)
  ctx.fillStyle = '#000000';
  ctx.fillRect(-11, -5, 22, 11);
  ctx.fillStyle = '#4a2318';
  ctx.fillRect(-10, -4, 20, 9);
  ctx.fillStyle = '#683322';
  ctx.fillRect(-8, -2, 16, 6);

  // White Rib Bones sticking upward
  ctx.fillStyle = '#ffffff';
  for (let i = -7; i <= 7; i += 3) {
    ctx.fillRect(i, -7, 2, 6);
  }
  // Black outlines around ribs
  ctx.fillStyle = '#000000';
  for (let i = -7; i <= 7; i += 3) {
    ctx.fillRect(i - 1, -8, 4, 1);
  }

  ctx.restore();
}

// 5. SAGUARO CACTUS (Tall cactus with branches)
export function drawSaguaroCactus(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-4, 5, 8, 3);

  // Black outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-3, -14, 6, 20); // main trunk
  ctx.fillRect(-7, -9, 5, 6);   // left branch
  ctx.fillRect(-7, -12, 3, 5);
  ctx.fillRect(2, -7, 5, 6);    // right branch
  ctx.fillRect(4, -10, 3, 5);

  // Green flesh (#2d6b38)
  ctx.fillStyle = '#2d6b38';
  ctx.fillRect(-2, -13, 4, 18);
  ctx.fillRect(-6, -8, 3, 4);
  ctx.fillRect(-6, -11, 2, 4);
  ctx.fillRect(3, -6, 3, 4);
  ctx.fillRect(4, -9, 2, 4);

  // Highlights
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(-1, -12, 1, 16);

  ctx.restore();
}

// 6. BARREL CACTUS (Round green ball with spines)
export function drawBarrelCactus(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-6, 4, 12, 3);

  // Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-6, -5, 12, 10);
  ctx.fillRect(-5, -6, 10, 12);

  // Green body (#276749)
  ctx.fillStyle = '#22543d';
  ctx.fillRect(-5, -4, 10, 8);
  ctx.fillStyle = '#2f855a';
  ctx.fillRect(-4, -3, 8, 6);

  // Spines / Ridge Lines
  ctx.fillStyle = '#9ae6b4';
  ctx.fillRect(-3, -3, 1, 6);
  ctx.fillRect(0, -3, 1, 6);
  ctx.fillRect(3, -3, 1, 6);

  ctx.restore();
}

// 7. EXPLOSIVES AMMO CHEST (Wooden crate from screenshot)
export function drawExplosivesChest(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(-8, 6, 16, 3);

  // Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-8, -6, 16, 12);

  // Dark Red / Mahogany Wood (#63171b)
  ctx.fillStyle = '#63171b';
  ctx.fillRect(-7, -5, 14, 10);
  ctx.fillStyle = '#7b2024';
  ctx.fillRect(-6, -4, 12, 8);

  // Cross Straps / Markings
  ctx.fillStyle = '#000000';
  ctx.fillRect(-2, -4, 4, 8);
  ctx.fillRect(-6, -1, 12, 2);

  ctx.restore();
}

// 8. RAD CANISTER & RAD PELLETS (Fluorescent green cylinder from screenshot)
export function drawRadCanister(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Glow
  ctx.fillStyle = 'rgba(72, 187, 120, 0.3)';
  ctx.fillRect(-7, -10, 14, 20);

  // Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-5, -9, 10, 18);

  // Green glass (#38a169 / #48bb78)
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(-4, -7, 8, 14);
  ctx.fillStyle = '#9ae6b4';
  ctx.fillRect(-2, -6, 4, 12);

  // Metal Caps
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(-4, -9, 8, 2);
  ctx.fillRect(-4, 7, 8, 2);

  ctx.restore();
}

export function drawRadPellet(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, 4, 4);
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
}

// 9. NUCLEAR THRONE CROSSHAIR (4 White Corner Brackets with black outline)
export function drawNuclearCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  const s = 6;
  const l = 4;
  const t = 2;

  // Black outline
  ctx.fillStyle = '#000000';
  // TL
  ctx.fillRect(-s - 1, -s - 1, l + 2, t + 2);
  ctx.fillRect(-s - 1, -s - 1, t + 2, l + 2);
  // TR
  ctx.fillRect(s - l - 1, -s - 1, l + 2, t + 2);
  ctx.fillRect(s - t - 1, -s - 1, t + 2, l + 2);
  // BL
  ctx.fillRect(-s - 1, s - t - 1, l + 2, t + 2);
  ctx.fillRect(-s - 1, s - l - 1, t + 2, l + 2);
  // BR
  ctx.fillRect(s - l - 1, s - t - 1, l + 2, t + 2);
  ctx.fillRect(s - t - 1, s - l - 1, t + 2, l + 2);

  // White inner
  ctx.fillStyle = '#ffffff';
  // TL
  ctx.fillRect(-s, -s, l, t);
  ctx.fillRect(-s, -s, t, l);
  // TR
  ctx.fillRect(s - l, -s, l, t);
  ctx.fillRect(s - t, -s, t, l);
  // BL
  ctx.fillRect(-s, s - t, l, t);
  ctx.fillRect(-s, s - l, t, l);
  // BR
  ctx.fillRect(s - l, s - t, l, t);
  ctx.fillRect(s - t, s - l, t, l);

  ctx.restore();
}
