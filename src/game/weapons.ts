import { WeaponType } from '../types';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  shortName: string;
  description: string;
  fireMode: string;
  fireRate: number; // Interval in seconds between shots
  damage: number; // Damage per projectile
  speed: number; // Projectile velocity in px/sec
  maxDistance: number; // Maximum effective range in px
  projectilesPerShot: number; // 1 for pistol/laser/plasma, 6 for shotgun
  spread: number; // Spread angle in radians
  recoil: number; // Screen shake magnitude on firing
  ammoCost: number; // Ammo consumed per trigger pull
  color: string; // Primary projectile / UI accent color
  glowColor: string; // Neon aura color
  spriteColor: string; // Color palette for ground drop crate
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  pistol: {
    id: 'pistol',
    name: 'Walther PPK Silenciada',
    shortName: 'PISTOLA SILENCIADA',
    description: 'Arma reglamentaria del Agente 007 con silenciador de grado militar. Disparo sigiloso y equilibrado.',
    fireMode: 'DISPARO PRECISO',
    fireRate: 0.20,
    damage: 3.5,
    speed: 720,
    maxDistance: 650,
    projectilesPerShot: 1,
    spread: 0.04,
    recoil: 3,
    ammoCost: 1,
    color: '#f6e05e',
    glowColor: '#eab308',
    spriteColor: '#475569',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Escopeta de Combate Spas-12',
    shortName: 'ESCOPETA TÁCTICA',
    description: 'Dispara una descarga radial de 6 perdigones incandescentes. Máximo impacto y dispersión a corta distancia.',
    fireMode: 'DISPERSIÓN (6 PERDIGONES)',
    fireRate: 0.48,
    damage: 2.4,
    speed: 640,
    maxDistance: 440,
    projectilesPerShot: 6,
    spread: 0.28,
    recoil: 8,
    ammoCost: 2,
    color: '#f97316',
    glowColor: '#ea580c',
    spriteColor: '#b45309',
  },
  laser: {
    id: 'laser',
    name: 'Fusil Láser Fotónico',
    shortName: 'FUSIL LÁSER',
    description: 'Emite pulsos coherentes a velocidad ultra-rápida. Precisión hiperbólica y choque electromagnético.',
    fireMode: 'RAYO CONTINUO',
    fireRate: 0.08,
    damage: 1.3,
    speed: 1250,
    maxDistance: 700,
    projectilesPerShot: 1,
    spread: 0.012,
    recoil: 1.8,
    ammoCost: 1,
    color: '#38bdf8',
    glowColor: '#0284c7',
    spriteColor: '#0ea5e9',
  },
  plasma: {
    id: 'plasma',
    name: 'Cañón de Plasma Pesado',
    shortName: 'CAÑÓN DE PLASMA',
    description: 'Genera esferas de plasma ionizado con detonación térmica y fragmentación de energía al impacto.',
    fireMode: 'ORBE DE PLASMA TÉRMICO',
    fireRate: 0.38,
    damage: 7.0,
    speed: 520,
    maxDistance: 560,
    projectilesPerShot: 1,
    spread: 0.03,
    recoil: 6,
    ammoCost: 2,
    color: '#22c55e',
    glowColor: '#16a34a',
    spriteColor: '#10b981',
  },
};

export function getWeaponDef(type: WeaponType): WeaponDef {
  return WEAPONS[type] || WEAPONS.pistol;
}
