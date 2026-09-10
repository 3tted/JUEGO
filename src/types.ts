export type Direction = 'N' | 'S' | 'E' | 'W';

export type WeaponType = 'pistol' | 'shotgun' | 'laser' | 'plasma';

export interface Point {
  x: number;
  y: number;
}

export type RoomType =
  | 'START'
  | 'PATROL'
  | 'LASER_GRID'
  | 'SERVER_HUB'
  | 'ARMORY'
  | 'CCTV_ROOM'
  | 'LABORATORY'
  | 'BOSS';

export interface RoomDoor {
  dir: Direction;
  targetRoomId: string;
  isOpen: boolean;
  isLocked: boolean;
  requiredKeycard?: string;
}

export interface Tile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'hazard' | 'cover' | 'elevator' | 'cactus' | 'barrel_cactus' | 'carcass';
  subType?: 'laser' | 'vent' | 'terminal' | 'crate' | 'camera_mount';
  walkable: boolean;
  seeThrough: boolean;
}

export interface GuardEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians
  speed: number;
  patrolPoints: Point[];
  currentPatrolIdx: number;
  state: 'idle' | 'patrol' | 'suspicious' | 'alert' | 'dead';
  alertMeter: number; // 0 to 100
  lastSeenPlayerPos?: Point;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  fovAngle: number; // FOV cone in radians (e.g. 70 deg)
  fovDistance: number;
  isHeavy?: boolean;
  enemyType?: 'bandit' | 'scorpion' | 'sniper' | 'heavy';
}

export interface CameraEntity {
  id: string;
  x: number;
  y: number;
  angle: number;
  minAngle: number;
  maxAngle: number;
  sweepSpeed: number;
  sweepDir: number;
  fovAngle: number;
  fovDistance: number;
  disabled: boolean;
  disableTimer: number;
}

export interface LaserBeam {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  cyclePeriod: number; // in seconds
  activeDuration: number;
  timer: number;
  horizontal: boolean;
}

export type TerminalMinigameType =
  | 'circuit_maze'
  | 'frequency_lock'
  | 'memory_cipher'
  | 'wire_bypass';

export interface TerminalEntity {
  id: string;
  x: number;
  y: number;
  hacked: boolean;
  hackProgress: number; // 0 to 100
  type: 'alarm_reset' | 'map_reveal' | 'disable_cameras' | 'boss_override';
  label: string;
  minigameType?: TerminalMinigameType;
}

export interface ItemDrop {
  id: string;
  x: number;
  y: number;
  type: 'ammo' | 'medkit' | 'emp_charge' | 'smoke_grenade' | 'intel' | 'keycard' | 'rad' | 'explosives' | 'weapon';
  amount: number;
  name: string;
  weaponType?: WeaponType;
}

export interface BossEntity {
  id: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  phase: 1 | 2;
  shield: number;
  maxShield: number;
  attackCooldown: number;
  state: 'idle' | 'chase' | 'barrage' | 'laser_sweep' | 'defeated';
  defeated: boolean;
}

export interface RoomInstance {
  id: string;
  gridX: number;
  gridY: number;
  type: RoomType;
  name: string;
  description: string;
  doors: Partial<Record<Direction, RoomDoor>>;
  tiles: Tile[][]; // [y][x] 15 wide by 11 high
  guards: GuardEntity[];
  cameras: CameraEntity[];
  lasers: LaserBeam[];
  terminals: TerminalEntity[];
  items: ItemDrop[];
  boss?: BossEntity;
  isCleared: boolean;
  isVisited: boolean;
  hasBeenRevealed: boolean;
  isLockedDown?: boolean;
  doorAnimProgress?: number;
  bounds: {
    worldX: number;
    worldY: number;
    width: number;
    height: number;
  };
}

export interface PathNode {
  roomId: string;
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number;
}

export interface DungeonFloor {
  seed: number;
  floorLevel: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  rooms: Map<string, RoomInstance>;
  startRoomId: string;
  bossRoomId: string;
  roomGrid: (string | null)[][];
  criticalPath: string[]; // roomIds connecting Start to Boss
  detailedPathWaypoints: Point[]; // Physical tile waypoints guaranteed walkable from player spawn to boss door
  totalGuards: number;
  totalTerminals: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ammo: number;
  maxAmmo: number;
  magAmmo: number;
  magCapacity: number;
  isReloading: boolean;
  reloadProgress: number;
  gadgets: {
    empDarts: number;
    smokeBombs: number;
  };
  keycards: string[];
  intelCollected: number;
  currentRoomId: string;
  isStealthing: boolean;
  isSprinting: boolean;
  isDashing: boolean;
  dashCooldown: number;
  dashTimer: number;
  noiseLevel: number; // 0 to 100, decays over time
  lastShotTime: number;
  walkCycle: number;
  isSwinging: boolean;
  swingProgress: number;
  explosivesAmmo: number;
  activeWeaponSlot: number;
  currentWeapon: WeaponType;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  damage: number;
  isEmp?: boolean;
  distanceTravelled: number;
  maxDistance: number;
  weaponType?: WeaponType;
  color?: string;
  glowColor?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'line' | 'spark' | 'smoke' | 'square';
  angle?: number;
}

export interface SmokeCloud {
  id: string;
  x: number;
  y: number;
  radius: number;
  duration: number;
}
