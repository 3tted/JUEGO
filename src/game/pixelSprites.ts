// Nuclear Throne Exact Pixel Sprites & Drawing Helpers
// Matches the provided screenshot 1:1:
// - Duck Mutant with Katana / Revolver
// - Desert Bandits with rifles
// - Radioactive Scorpion
// - Maggot Bone Carcass
// - Saguaro & Barrel Cacti
// - Explosives Chest & Rad Canister
// - 4-Bracket Crosshair

import { WeaponType } from '../types';

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

// 1. AGENTE 007 PROTAGONIST (Classic Black Tuxedo, Bowtie, Walther PPK Silencer, Shotgun, Laser, Plasma & Katana)
export function drawAgent007Player(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  walkCycle: number,
  isMoving: boolean,
  isSwinging: boolean,
  swingProgress: number,
  weaponType: WeaponType = 'pistol'
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  const bob = isMoving ? Math.sin(walkCycle * 12) * 1.5 : 0;
  const isFacingLeft = Math.cos(angle) < 0;

  // Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(-7, 8, 14, 3);

  ctx.translate(0, Math.floor(bob));

  // TUXEDO LEGS & SHOES
  const legOffset = isMoving ? Math.sin(walkCycle * 12) * 2.5 : 0;
  // Black trousers
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(-5, 6, 4, 4);
  ctx.fillRect(1, 6, 4, 4);
  // Polished black shoes with shiny toe cap
  ctx.fillStyle = '#000000';
  ctx.fillRect(-6 + legOffset, 10, 5, 2);
  ctx.fillRect(1 - legOffset, 10, 5, 2);
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(-5 + legOffset, 10, 2, 1);
  ctx.fillRect(2 - legOffset, 10, 2, 1);

  // TUXEDO JACKET & BODY
  // Outer black silhouette
  ctx.fillStyle = '#000000';
  ctx.fillRect(-8, -5, 16, 12);
  ctx.fillRect(-9, -3, 18, 9);

  // Black Tuxedo Cloth
  ctx.fillStyle = '#141418';
  ctx.fillRect(-7, -4, 14, 10);

  // White Dress Shirt V-Chest
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3, -4, 6, 7);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-1, -4, 2, 7);

  // Black Satin Bowtie
  ctx.fillStyle = '#000000';
  ctx.fillRect(-2, -4, 4, 2);
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(-1, -4, 2, 2);

  // Tuxedo Lapels (Deep Charcoal Black)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-6, -4, 3, 9);
  ctx.fillRect(3, -4, 3, 9);

  // White Pocket Square (left chest)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5, -1, 2, 1);

  // AGENT 007 HEAD & FACE
  // Head outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(-7, -15, 14, 11);
  ctx.fillRect(-8, -13, 16, 8);

  // Human Skin Tone (#fed7aa - fair/warm)
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(-6, -13, 12, 8);
  ctx.fillStyle = '#fbb688';
  ctx.fillRect(-6, -7, 12, 2); // chin / jaw shadow

  // Suave Slicked-Back Dark Hair (007 James Bond style)
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-7, -15, 14, 4); // top hair
  ctx.fillRect(-7, -13, 3, 4);  // sideburn left
  ctx.fillRect(4, -13, 3, 4);   // sideburn right
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-5, -14, 9, 2);  // hair sheen / highlight

  // Eyes / Tactical Sunglasses (Cool Agent 007 dark shades)
  const eyeShift = isFacingLeft ? -2 : 1;
  ctx.fillStyle = '#000000';
  ctx.fillRect(-4 + eyeShift, -11, 4, 3);
  ctx.fillRect(1 + eyeShift, -11, 4, 3);
  // Lens reflection (blue/white glint)
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(-3 + eyeShift, -11, 2, 1);
  ctx.fillRect(2 + eyeShift, -11, 2, 1);

  // WEAPONS: WALTHER PPK WITH SILENCER & KATANA
  if (isSwinging) {
    // Katana Slash
    ctx.save();
    let swordAngle = angle - Math.PI / 4;
    swordAngle += Math.sin(swingProgress * Math.PI) * 1.8;
    ctx.rotate(swordAngle);
    ctx.translate(3, -12);

    // Sword outline & blade
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -22, 6, 26);
    ctx.fillRect(-5, 0, 10, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -21, 4, 22);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, -21, 2, 22);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-2, 1, 4, 6);
    ctx.restore();
  } else {
    // Weapon rendering based on currently equipped weaponType
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(6, 1);

    if (weaponType === 'shotgun') {
      // 1. COMBAT SHOTGUN (Spas-12 heavy double-handed pump shotgun)
      // Rear Tuxedo arm & shoulder stock
      ctx.fillStyle = '#000000';
      ctx.fillRect(-5, -2, 6, 5);
      ctx.fillStyle = '#141418';
      ctx.fillRect(-4, -1, 5, 3);

      // Wooden/Composite Tactical Stock
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-3, -2, 4, 3);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-4, -1, 2, 2);

      // Main Shotgun Receiver (Heavy Gunmetal)
      ctx.fillStyle = '#000000';
      ctx.fillRect(1, -3, 9, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, -2, 7, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, -1, 3, 2); // ejection port

      // Trigger Hand (Skin)
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(1, 0, 3, 3);

      // Heavy Ribbed Barrel & Heat Shield (Longer & wider than pistol)
      ctx.fillStyle = '#000000';
      ctx.fillRect(9, -3, 12, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, -2, 10, 3);
      // Heat vent perforations
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(11, -2, 2, 1);
      ctx.fillRect(14, -2, 2, 1);
      ctx.fillRect(17, -2, 2, 1);

      // Underbarrel Magazine Tube & Orange/Brown Pump Grip
      ctx.fillStyle = '#000000';
      ctx.fillRect(8, 1, 9, 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(9, 2, 7, 2);

      // Support Hand gripping pump (Skin & sleeve)
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(11, 1, 3, 3);
      ctx.fillStyle = '#141418';
      ctx.fillRect(9, 2, 3, 2);

      // Twin Muzzle Tips with heat tint
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, -3, 2, 4);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(21, -2, 1, 2); // glowing hot muzzle ring
    } else if (weaponType === 'laser') {
      // 2. PHOTONIC LASER CARBINE (Sleek futuristic cybernetic rail with glowing cyan core)
      // Tuxedo Arm
      ctx.fillStyle = '#000000';
      ctx.fillRect(-2, -2, 7, 5);
      ctx.fillStyle = '#141418';
      ctx.fillRect(-1, -1, 5, 3);

      // Primary Hand
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(3, -1, 3, 3);

      // Sleek High-Tech Frame (Deep Navy / Carbon)
      ctx.fillStyle = '#000000';
      ctx.fillRect(5, -3, 16, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, -2, 14, 4);

      // Top Optical Collimator Scope
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(7, -4, 6, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, -4, 2, 1); // scope lens

      // Animated Glowing Cyan Energy Capacitor / Plasma Rail
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(7, -1, 8, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(8, -1, 6, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 0, 3, 1); // bright core

      // Laser Twin Rails & Focal Projector Tip
      ctx.fillStyle = '#475569';
      ctx.fillRect(15, -2, 5, 1);
      ctx.fillRect(15, 1, 5, 1);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(19, -2, 3, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(21, -1, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(22, 0, 1, 1); // glowing laser emitter diode
    } else if (weaponType === 'plasma') {
      // 3. HEAVY PLASMA CANNON (Bulky toxic green energy cannon with visible reactor)
      // Tuxedo Arm & Support
      ctx.fillStyle = '#000000';
      ctx.fillRect(-3, -2, 8, 6);
      ctx.fillStyle = '#141418';
      ctx.fillRect(-2, -1, 6, 4);

      // Primary Hand
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(3, -1, 3, 3);

      // Bulky Heavy Body (Dark Military Green / Iron)
      ctx.fillStyle = '#000000';
      ctx.fillRect(4, -4, 14, 8);
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(5, -3, 12, 6);

      // Top Copper Heat-sink Cooling Fins
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6, -5, 2, 2);
      ctx.fillRect(9, -5, 2, 2);
      ctx.fillRect(12, -5, 2, 2);

      // Glowing Emerald Plasma Containment Chamber
      ctx.fillStyle = '#047857';
      ctx.fillRect(7, -2, 6, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(8, -1, 4, 3);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(9, 0, 2, 1); // hot inner core

      // Wide Flared Plasma Funnel Nozzle
      ctx.fillStyle = '#022c22';
      ctx.fillRect(15, -4, 4, 7);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(17, -3, 2, 5);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(18, -2, 1, 3); // plasma charge ring
    } else {
      // 4. CLASSIC 007 WALTHER PPK WITH SUPPRESSOR / SILENCER
      // Tuxedo arm extending with pistol
      ctx.fillStyle = '#000000';
      ctx.fillRect(-2, -2, 7, 5);
      ctx.fillStyle = '#141418';
      ctx.fillRect(-1, -1, 5, 3);

      // Hand (skin)
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(4, -1, 3, 3);

      // Walther PPK Body (Gunmetal / Dark Slate)
      ctx.fillStyle = '#000000';
      ctx.fillRect(6, -2, 6, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, -1, 4, 2);

      // Silencer / Suppressor (Long black barrel cylinder)
      ctx.fillStyle = '#000000';
      ctx.fillRect(11, -2, 8, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, -1, 6, 1);
      ctx.fillStyle = '#475569';
      ctx.fillRect(17, -1, 1, 1); // silencer tip
    }

    ctx.restore();
  }

  ctx.restore();
}

// Backward-compatible alias
export const drawDuckPlayer = drawAgent007Player;

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

// 7. HEAVY BLAST SECURITY DOOR (Smooth Sliding Blast Gate with Hazard Stripes & Lock Beacon)
export function drawNuclearThroneDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 'N' | 'S' | 'E' | 'W',
  animProgress: number, // 0 = fully open, 1 = fully closed/locked
  isLocked: boolean
) {
  const S = 48; // TILE_SIZE
  const isHorizontal = dir === 'N' || dir === 'S';

  // 1. Base Threshold Floor & Guide Tracks (Dark steel threshold recessed into sand)
  ctx.fillStyle = '#3e3427';
  ctx.fillRect(x, y, S, S);
  ctx.fillStyle = '#261f18';
  ctx.fillRect(x + 2, y + 2, S - 4, S - 4);

  // Metal runner rails
  if (isHorizontal) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y + 6, S, 2);
    ctx.fillRect(x, y + S - 8, S, 2);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y + 7, S, 1);
    ctx.fillRect(x, y + S - 7, S, 1);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 6, y, 2, S);
    ctx.fillRect(x + S - 8, y, 2, S);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 7, y, 1, S);
    ctx.fillRect(x + S - 7, y, 1, S);
  }

  // 2. Door Frame Jambs / Reinforced Pillars (at the two ends of the doorway)
  ctx.fillStyle = '#000000';
  if (isHorizontal) {
    // Left & Right pillar mounts
    ctx.fillRect(x, y, 6, S);
    ctx.fillRect(x + S - 6, y, 6, S);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 1, y + 1, 4, S - 2);
    ctx.fillRect(x + S - 5, y + 1, 4, S - 2);
  } else {
    // Top & Bottom pillar mounts
    ctx.fillRect(x, y, S, 6);
    ctx.fillRect(x, y + S - 6, S, 6);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 1, y + 1, S - 2, 4);
    ctx.fillRect(x + 1, y + S - 5, S - 2, 4);
  }

  // Status LED lights on the frame (Green = open/clear, Red = locked down)
  const lightColor = animProgress > 0.3 ? '#ef4444' : '#22c55e';
  const lightGlow = animProgress > 0.3 ? '#f87171' : '#86efac';
  if (isHorizontal) {
    ctx.fillStyle = lightGlow;
    ctx.fillRect(x + 2, y + S / 2 - 3, 2, 6);
    ctx.fillRect(x + S - 4, y + S / 2 - 3, 2, 6);
    ctx.fillStyle = lightColor;
    ctx.fillRect(x + 2, y + S / 2 - 2, 2, 4);
    ctx.fillRect(x + S - 4, y + S / 2 - 2, 2, 4);
  } else {
    ctx.fillStyle = lightGlow;
    ctx.fillRect(x + S / 2 - 3, y + 2, 6, 2);
    ctx.fillRect(x + S / 2 - 3, y + S - 4, 6, 2);
    ctx.fillStyle = lightColor;
    ctx.fillRect(x + S / 2 - 2, y + 2, 4, 2);
    ctx.fillRect(x + S / 2 - 2, y + S - 4, 4, 2);
  }

  // 3. Sliding Blast Gate Panels
  if (animProgress > 0.02) {
    const halfS = S / 2;
    const travel = halfS * animProgress;

    ctx.save();
    if (isHorizontal) {
      // Left panel sliding right towards center
      const leftW = Math.ceil(travel);
      const rightX = Math.floor(x + S - travel);
      const rightW = Math.ceil(travel);

      // Panel 1: Left
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y + 4, leftW, S - 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y + 5, Math.max(0, leftW - 1), S - 10);
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y + 7, Math.max(0, leftW - 3), 3);
      ctx.fillRect(x, y + S - 10, Math.max(0, leftW - 3), 3);

      // Panel 2: Right
      ctx.fillStyle = '#000000';
      ctx.fillRect(rightX, y + 4, rightW, S - 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rightX + 1, y + 5, rightW - 1, S - 10);
      ctx.fillStyle = '#334155';
      ctx.fillRect(rightX + 2, y + 7, Math.max(0, rightW - 3), 3);
      ctx.fillRect(rightX + 2, y + S - 10, Math.max(0, rightW - 3), 3);

      // Yellow/Black Hazard stripes on panels when sufficiently closed
      if (animProgress > 0.5) {
        ctx.fillStyle = '#eab308';
        const stripLeftW = Math.min(8, Math.max(0, leftW - 8));
        const stripRightW = Math.min(8, Math.max(0, rightW - 4));
        if (stripLeftW > 0) ctx.fillRect(x + 7, y + 14, stripLeftW, 4);
        if (stripRightW > 0) ctx.fillRect(x + S - 15, y + 14, stripRightW, 4);
      }

      // Interlocking seam & Central Security Lock when closed
      if (animProgress >= 0.85) {
        // Interlocking teeth
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + halfS - 2, y + 8, 4, 8);
        ctx.fillRect(x + halfS - 2, y + 20, 4, 8);
        ctx.fillRect(x + halfS - 2, y + 32, 4, 8);

        // Heavy red lockdown lock badge in center
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + halfS - 7, y + halfS - 7, 14, 14);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(x + halfS - 6, y + halfS - 6, 12, 12);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + halfS - 4, y + halfS - 4, 8, 8);
        // Lock shackle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + halfS - 2, y + halfS - 3, 4, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + halfS - 1, y + halfS - 2, 2, 2);
      }
    } else {
      // Vertical door: Top and Bottom panels sliding towards center
      const topH = Math.ceil(travel);
      const botY = Math.floor(y + S - travel);
      const botH = Math.ceil(travel);

      // Panel 1: Top
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 4, y, S - 8, topH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 5, y, S - 10, Math.max(0, topH - 1));
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 7, y, 3, Math.max(0, topH - 3));
      ctx.fillRect(x + S - 10, y, 3, Math.max(0, topH - 3));

      // Panel 2: Bottom
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 4, botY, S - 8, botH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 5, botY + 1, S - 10, botH - 1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 7, botY + 2, 3, Math.max(0, botH - 3));
      ctx.fillRect(x + S - 10, botY + 2, 3, Math.max(0, botH - 3));

      // Hazard stripes
      if (animProgress > 0.5) {
        ctx.fillStyle = '#eab308';
        const stripTopH = Math.min(8, Math.max(0, topH - 8));
        const stripBotH = Math.min(8, Math.max(0, botH - 4));
        if (stripTopH > 0) ctx.fillRect(x + 14, y + 7, 4, stripTopH);
        if (stripBotH > 0) ctx.fillRect(x + 14, y + S - 15, 4, stripBotH);
      }

      // Interlocking seam & Central Security Lock when closed
      if (animProgress >= 0.85) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 8, y + halfS - 2, 8, 4);
        ctx.fillRect(x + 20, y + halfS - 2, 8, 4);
        ctx.fillRect(x + 32, y + halfS - 2, 8, 4);

        // Lock badge
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + halfS - 7, y + halfS - 7, 14, 14);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(x + halfS - 6, y + halfS - 6, 12, 12);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + halfS - 4, y + halfS - 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + halfS - 2, y + halfS - 3, 4, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + halfS - 1, y + halfS - 2, 2, 2);
      }
    }
    ctx.restore();
  }
}

// 8. RETRO TACTICAL COMPUTER CONSOLE / HACKING TERMINAL (Mini arcade / rugged mainframe desk)
export function drawConsoleTerminal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hacked: boolean,
  animTick: number,
  isNearby: boolean = false,
  minigameType?: string
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // 1. Soft Oval Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pulse effect when player is nearby or idle
  const pulse = Math.sin(animTick * 5) * 0.5 + 0.5;

  // 2. Main Console Cabinet Body (Rugged dark metal mainframe casing)
  // Outer black border
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-15, -17, 30, 30);

  // Metal body chassis
  ctx.fillStyle = '#1e293b'; // slate 800
  ctx.fillRect(-14, -16, 28, 28);

  // Side reinforcement panels / metallic trims with copper rivets
  ctx.fillStyle = '#334155';
  ctx.fillRect(-14, -16, 3, 28);
  ctx.fillRect(11, -16, 3, 28);

  // Rivets
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-13, -14, 1, 1);
  ctx.fillRect(-13, 8, 1, 1);
  ctx.fillRect(12, -14, 1, 1);
  ctx.fillRect(12, 8, 1, 1);

  // 3. CRT Monitor Screen Housing (Upper Section)
  ctx.fillStyle = '#020617'; // bezel
  ctx.fillRect(-10, -14, 20, 15);

  // Screen background color based on minigame type
  let screenBg = '#052e16';
  let screenTheme = '#22c55e';
  if (minigameType === 'frequency_lock') {
    screenBg = '#082f49';
    screenTheme = '#38bdf8';
  } else if (minigameType === 'memory_cipher') {
    screenBg = '#422006';
    screenTheme = '#f59e0b';
  } else if (minigameType === 'wire_bypass') {
    screenBg = '#2e1065';
    screenTheme = '#c084fc';
  }

  if (hacked) {
    screenBg = '#064e3b';
  }

  ctx.fillStyle = screenBg;
  ctx.fillRect(-9, -13, 18, 13);

  // Animated Scanlines & Phosphor Display
  if (!hacked) {
    if (minigameType === 'frequency_lock') {
      // Oscilloscope Sine Wave
      ctx.fillStyle = isNearby ? '#7dd3fc' : screenTheme;
      for (let ox = -8; ox <= 8; ox += 2) {
        const oy = Math.sin((ox + animTick * 12) * 0.45) * 3.5;
        ctx.fillRect(ox, Math.floor(-7 + oy), 2, 1);
      }
    } else if (minigameType === 'memory_cipher') {
      // Memory hex code lights
      const step = Math.floor(animTick * 3) % 4;
      ctx.fillStyle = isNearby ? '#fbbf24' : screenTheme;
      ctx.fillRect(-7, -11, 4, 3);
      ctx.fillRect(-1, -11, 4, 3);
      ctx.fillRect(5, -11, 3, 3);
      ctx.fillStyle = '#fef08a';
      if (step === 0) ctx.fillRect(-7, -11, 4, 3);
      else if (step === 1) ctx.fillRect(-1, -11, 4, 3);
      else if (step === 2) ctx.fillRect(5, -11, 3, 3);
      ctx.fillStyle = screenTheme;
      ctx.fillRect(-7, -6, 12, 2);
    } else if (minigameType === 'wire_bypass') {
      // Electric conduit flow lines
      ctx.fillStyle = isNearby ? '#e879f9' : screenTheme;
      ctx.fillRect(-7, -7, 14, 2);
      ctx.fillRect(-2, -12, 2, 11);
      const pulseX = -7 + Math.floor((animTick * 18) % 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pulseX, -7, 2, 2);
    } else {
      // Circuit maze probe / cyber lines
      ctx.fillStyle = isNearby ? '#4ade80' : screenTheme;
      const waveY = Math.floor(Math.sin(animTick * 8) * 2.5);
      ctx.fillRect(-7, -11, 14, 1);
      ctx.fillRect(-7, -9, 9, 1);
      ctx.fillRect(-7, -7, 11, 1);
      ctx.fillStyle = '#86efac';
      const blipX = -6 + Math.floor((animTick * 14) % 12);
      ctx.fillRect(blipX, -5 + waveY, 2, 2);
      if (Math.sin(animTick * 10) > 0) {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(3, -9, 2, 2);
      }
    }
  } else {
    // Hacked screen: checkmark & [OK]
    ctx.fillStyle = '#34d399';
    ctx.fillRect(-4, -6, 2, 3);
    ctx.fillRect(-2, -4, 2, 4);
    ctx.fillRect(0, -7, 2, 7);
    ctx.fillRect(2, -10, 2, 4);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-7, -12, 14, 1);
  }

  // CRT Glass highlight reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(-8, -12, 3, 11);

  // 4. Slanted Control Deck / Keyboard (Bottom Half)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-12, 2, 24, 9);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-11, 3, 22, 7);

  // Colorful Terminal Buttons & Trackball
  ctx.fillStyle = '#eab308'; // Amber key
  ctx.fillRect(-9, 4, 3, 2);
  ctx.fillStyle = '#ef4444'; // Red key
  ctx.fillRect(-5, 4, 3, 2);
  ctx.fillStyle = '#3b82f6'; // Blue key
  ctx.fillRect(-1, 4, 3, 2);
  ctx.fillStyle = '#10b981'; // Green key
  ctx.fillRect(3, 4, 3, 2);
  ctx.fillStyle = '#a855f7'; // Purple key
  ctx.fillRect(7, 4, 2, 2);

  // Trackball / mini joystick
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-2, 7, 4, 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-1, 6, 2, 2);

  // 5. LED Beacon / Antenna on Top
  ctx.fillStyle = '#475569';
  ctx.fillRect(-1, -20, 2, 4);
  const beaconColor = hacked
    ? '#10b981'
    : isNearby
    ? '#facc15'
    : minigameType === 'frequency_lock'
    ? '#38bdf8'
    : minigameType === 'memory_cipher'
    ? '#f59e0b'
    : minigameType === 'wire_bypass'
    ? '#c084fc'
    : pulse > 0.5
    ? '#22c55e'
    : '#15803d';
  ctx.fillStyle = '#000000';
  ctx.fillRect(-3, -23, 6, 4);
  ctx.fillStyle = beaconColor;
  ctx.fillRect(-2, -22, 4, 2);

  // Light flare / glow when unhacked or nearby
  if (!hacked && (isNearby || pulse > 0.4)) {
    ctx.fillStyle = isNearby ? 'rgba(250, 204, 21, 0.4)' : `${beaconColor}44`;
    ctx.beginPath();
    ctx.arc(0, -21, isNearby ? 9 + pulse * 4 : 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Floating Interactive Prompt Badge when nearby
  if (isNearby) {
    let badgeText = '[E] TERMINAL';
    if (hacked) {
      badgeText = 'CONSOLA [PIRATEADA]';
    } else if (minigameType === 'frequency_lock') {
      badgeText = '[E] ONDAS DE RADIO';
    } else if (minigameType === 'memory_cipher') {
      badgeText = '[E] SECUENCIA NEMÓNICA';
    } else if (minigameType === 'wire_bypass') {
      badgeText = '[E] DESVÍO DE CIRCUITOS';
    } else {
      badgeText = '[E] LABERINTO CRIPTO';
    }

    const badgeColor = hacked ? '#10b981' : isNearby ? '#facc15' : screenTheme;
    ctx.save();
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(badgeText).width;
    const by = -29 - Math.floor(pulse * 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(-Math.ceil(tw / 2) - 4, by - 8, Math.ceil(tw) + 8, 11);
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(-Math.ceil(tw / 2) - 4, by - 8, Math.ceil(tw) + 8, 11);

    ctx.fillStyle = badgeColor;
    ctx.fillText(badgeText, 0, by);
    ctx.restore();
  }

  ctx.restore();
}

// 12. ADVANCED WEAPON PICKUP PEDESTAL & FLOATING SPRITE
export function drawWeaponPickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  weaponType: WeaponType,
  gameTime: number = 0,
  isNearby: boolean = false
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  const bob = Math.sin(gameTime * 3.5 + x * 0.1) * 3;
  const pulse = Math.sin(gameTime * 5 + y * 0.1) * 0.5 + 0.5;

  let auraColor = 'rgba(234, 179, 8, 0.35)';
  let badgeColor = '#eab308';
  let badgeText = 'WALTHER PPK';

  if (weaponType === 'shotgun') {
    auraColor = 'rgba(249, 115, 22, 0.4)';
    badgeColor = '#f97316';
    badgeText = 'ESCOPETA TÁCTICA';
  } else if (weaponType === 'laser') {
    auraColor = 'rgba(56, 189, 248, 0.45)';
    badgeColor = '#38bdf8';
    badgeText = 'FUSIL LÁSER';
  } else if (weaponType === 'plasma') {
    auraColor = 'rgba(34, 197, 94, 0.45)';
    badgeColor = '#22c55e';
    badgeText = 'CAÑÓN DE PLASMA';
  }

  // Ground shadow & neon emitter ring
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.ellipse(0, 6, 18 + pulse * 4, 8 + pulse * 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Floating Weapon Sprite
  ctx.save();
  ctx.translate(0, -6 + bob);

  if (weaponType === 'shotgun') {
    // SPAS-12 COMBAT SHOTGUN SPRITE
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-13, -2, 28, 6);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-12, -4, 6, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-11, -3, 4, 4);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-6, -5, 10, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5, -4, 8, 6);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-2, -3, 4, 2);

    ctx.fillStyle = '#000000';
    ctx.fillRect(4, 0, 8, 4);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(5, 1, 6, 2);

    ctx.fillStyle = '#000000';
    ctx.fillRect(4, -5, 13, 5);
    ctx.fillStyle = '#334155';
    ctx.fillRect(5, -4, 11, 3);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, -4, 2, 1);
    ctx.fillRect(10, -4, 2, 1);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(17, -5, 2, 5);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(18, -4, 1, 3);
  } else if (weaponType === 'laser') {
    // PHOTONIC LASER CARBINE SPRITE
    ctx.fillStyle = '#000000';
    ctx.fillRect(-10, -5, 24, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-9, -4, 22, 6);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-6, -7, 8, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-1, -7, 3, 2);

    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-5, -3, 10, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -2, 8, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -2, 4, 1);

    ctx.fillStyle = '#475569';
    ctx.fillRect(5, -4, 9, 2);
    ctx.fillRect(5, 0, 9, 2);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(13, -3, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, -2, 2, 2);
  } else if (weaponType === 'plasma') {
    // HEAVY PLASMA CANNON SPRITE
    ctx.fillStyle = '#000000';
    ctx.fillRect(-11, -6, 24, 11);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-10, -5, 22, 9);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(-7, -8, 3, 3);
    ctx.fillRect(-2, -8, 3, 3);
    ctx.fillRect(3, -8, 3, 3);

    ctx.fillStyle = '#047857';
    ctx.fillRect(-6, -3, 11, 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-5, -2, 9, 4);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(-3, -1, 5, 2);

    ctx.fillStyle = '#022c22';
    ctx.fillRect(9, -6, 5, 11);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(11, -5, 3, 9);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(13, -3, 2, 5);
  } else {
    // CLASSIC WALTHER PPK SILENCED
    ctx.fillStyle = '#000000';
    ctx.fillRect(-7, -4, 19, 7);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -3, 8, 5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -3, 9, 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, -2, 2, 2);
  }

  ctx.restore();

  // Floating Tag Banner
  const tagY = -22 + bob;
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  const displayTitle = isNearby ? `[E] SUSTITUIR: ${badgeText}` : badgeText;
  const tw = ctx.measureText(displayTitle).width;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(-Math.ceil(tw / 2) - 4, tagY - 7, Math.ceil(tw) + 8, 10);
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(-Math.ceil(tw / 2) - 4, tagY - 7, Math.ceil(tw) + 8, 10);

  ctx.fillStyle = isNearby ? '#ffffff' : badgeColor;
  ctx.fillText(displayTitle, 0, tagY);

  ctx.restore();
}

// 13. CUSTOM HIGH-FIDELITY PROJECTILE RENDERING
export function drawCustomProjectile(
  ctx: CanvasRenderingContext2D,
  p: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    fromPlayer: boolean;
    weaponType?: WeaponType;
  },
  gameTime: number = 0
) {
  ctx.save();
  ctx.translate(Math.floor(p.x), Math.floor(p.y));

  if (!p.fromPlayer) {
    // Enemy bullet: sinister red energy slug
    ctx.fillStyle = '#000000';
    ctx.fillRect(-2, -2, 5, 5);
    ctx.fillStyle = '#ff2020';
    ctx.fillRect(-1, -1, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
    return;
  }

  const wType = p.weaponType || 'pistol';
  const angle = Math.atan2(p.vy, p.vx);

  if (wType === 'shotgun') {
    // Dense fiery buckshot pellet with glowing combustion trail
    ctx.rotate(angle);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-2, -1.5, 4, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-0.5, -0.5, 2, 1);

    // Trailing combustion embers
    ctx.fillStyle = 'rgba(234, 88, 12, 0.6)';
    ctx.fillRect(-5, -1, 2, 2);
  } else if (wType === 'laser') {
    // Elongated Continuous Laser Beam segment (18px long)
    ctx.rotate(angle);

    // Outer neon glow
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(-10, -3, 20, 6);

    // Main cyan laser beam line
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-9, -2, 18, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-8, -1.5, 16, 3);

    // Hot hyper-energetic white core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -0.5, 13, 1);
  } else if (wType === 'plasma') {
    // Heavy Pulsating Emerald/Neon Plasma Sphere
    const orbPulse = Math.sin(gameTime * 15 + p.x) * 1.5;

    // Glowing ionic aura
    ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, 7 + orbPulse, 0, Math.PI * 2);
    ctx.fill();

    // Dark outline
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Radiant emerald body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Hot central core
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(-1, -1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-0.5, -0.5, 1, 1);
  } else {
    // Default Silenced Pistol 9mm bullet
    ctx.rotate(angle);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = '#f6e05e';
    ctx.fillRect(-2, -1, 4, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -0.5, 2, 1);
  }

  ctx.restore();
}
