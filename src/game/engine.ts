import {
  BossEntity,
  CameraEntity,
  Direction,
  DungeonFloor,
  GuardEntity,
  ItemDrop,
  LaserBeam,
  Particle,
  PlayerState,
  Point,
  Projectile,
  RoomInstance,
  SmokeCloud,
  TerminalEntity,
  WeaponType,
} from '../types';
import { sound } from './audio';
import { getWeaponDef } from './weapons';
import { CENTER_TILE, DOOR_E, DOOR_N, DOOR_S, DOOR_W, ROOM_HEIGHT, ROOM_WIDTH, TILE_SIZE } from './prefabs';
import {
  drawAgent007Player,
  drawBandit,
  drawBarrelCactus,
  drawBoneCarcass,
  drawConsoleTerminal,
  drawCustomProjectile,
  drawExplosivesChest,
  drawNuclearCrosshair,
  drawNuclearThroneDoor,
  drawPixelRect,
  drawRadCanister,
  drawRadPellet,
  drawSaguaroCactus,
  drawScorpion,
  drawWeaponPickup,
} from './pixelSprites';

export interface FloatingNotice {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface BulletCasing {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

export interface RadDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  lifetime: number;
}

export interface GameEngineCallbacks {
  onFloorCleared?: () => void;
  onPlayerDied?: () => void;
  onAlarmChange?: (level: number) => void;
  onIntelFound?: (count: number) => void;
  onRoomEntered?: (room: RoomInstance) => void;
  onTerminalOpen?: (terminal: TerminalEntity) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public dungeon: DungeonFloor;
  public player: PlayerState;
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public casings: BulletCasing[] = [];
  public radDrops: RadDrop[] = [];
  public smokeClouds: SmokeCloud[] = [];

  // Screen Shake & Camera
  public screenShake: number = 0;
  public cameraX: number = 0;
  public cameraY: number = 0;

  // Zoom scale for chunky Nuclear Throne pixels
  public zoom: number = 2.2;

  // Alarms
  public alarmLevel: number = 0;
  public isAlarmTriggered: boolean = false;
  public alarmTimer: number = 0;

  // Interactive path visualization
  public showPathGuide: boolean = true;
  public blueprintMode: boolean = false;

  // Controls
  public keys: Record<string, boolean> = {};
  public mousePos: Point = { x: 0, y: 0 };
  public mouseWorldPos: Point = { x: 0, y: 0 };
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;

  // Cadencia de fuego (Fire Rate) en segundos para disparo automático con flechitas
  public fireRate: number = 0.20;
  private shootCooldownTimer: number = 0;

  // Katana Slash Arc
  public slashCooldown: number = 0;

  // Proximity Legend & Floating World Notices
  public activeLegend: string | null = null;
  public floatingNotices: FloatingNotice[] = [];

  public addFloatingNotice(x: number, y: number, text: string, color: string = '#ffffff') {
    const existing = this.floatingNotices.find((n) => n.text === text && Math.hypot(n.x - x, n.y - y) < 28);
    if (existing) {
      existing.life = 1.0;
      return;
    }
    this.floatingNotices.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      life: 1.4,
      maxLife: 1.4,
    });
  }

  // Running loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  public gameTime: number = 0;
  public isPaused: boolean = false;
  private callbacks: GameEngineCallbacks;
  public isTransitioning: boolean = false;

  public pause() {
    this.isPaused = true;
    this.keys = {};
    this.isMouseDown = false;
  }

  public resume() {
    this.isPaused = false;
    this.keys = {};
    this.isMouseDown = false;
    this.lastTime = performance.now();
  }

  constructor(
    canvas: HTMLCanvasElement,
    dungeon: DungeonFloor,
    callbacks: GameEngineCallbacks = {},
    restoredSave?: {
      playerX: number;
      playerY: number;
      currentRoomId: string;
      health: number;
      maxHealth: number;
      ammo: number;
      explosivesAmmo?: number;
      intelCollected?: number;
      clearedRoomIds?: string[];
      visitedRoomIds?: string[];
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dungeon = dungeon;
    this.callbacks = callbacks;

    const startRoom = dungeon.rooms.get(dungeon.startRoomId)!;
    const defaultStartX = startRoom.bounds.worldX + CENTER_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const defaultStartY = startRoom.bounds.worldY + CENTER_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    const startX = restoredSave ? restoredSave.playerX : defaultStartX;
    const startY = restoredSave ? restoredSave.playerY : defaultStartY;
    const initialRoomId =
      restoredSave && dungeon.rooms.has(restoredSave.currentRoomId)
        ? restoredSave.currentRoomId
        : dungeon.startRoomId;

    this.player = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      angle: 0,
      health: restoredSave ? restoredSave.health : 8,
      maxHealth: restoredSave ? restoredSave.maxHealth : 8,
      armor: 4,
      maxArmor: 4,
      ammo: restoredSave ? restoredSave.ammo : 36,
      maxAmmo: 99,
      magAmmo: 8,
      magCapacity: 8,
      isReloading: false,
      reloadProgress: 0,
      gadgets: {
        empDarts: 3,
        smokeBombs: 2,
      },
      keycards: [],
      intelCollected: restoredSave?.intelCollected ?? 12,
      currentRoomId: initialRoomId,
      isStealthing: false,
      isSprinting: false,
      isDashing: false,
      dashCooldown: 0,
      dashTimer: 0,
      noiseLevel: 0,
      lastShotTime: 0,
      walkCycle: 0,
      isSwinging: false,
      swingProgress: 0,
      explosivesAmmo: restoredSave?.explosivesAmmo ?? 18,
      activeWeaponSlot: 2,
      currentWeapon: 'pistol',
    };

    this.cameraX = startX;
    this.cameraY = startY;

    // If restoring rooms
    if (restoredSave?.visitedRoomIds) {
      for (const rId of restoredSave.visitedRoomIds) {
        const r = dungeon.rooms.get(rId);
        if (r) {
          r.isVisited = true;
          r.hasBeenRevealed = true;
        }
      }
    }
    if (restoredSave?.clearedRoomIds) {
      for (const rId of restoredSave.clearedRoomIds) {
        const r = dungeon.rooms.get(rId);
        if (r) {
          r.isCleared = true;
          r.isLockedDown = false;
          r.guards = [];
          if (r.boss) r.boss.defeated = true;
        }
      }
    }

    startRoom.isVisited = true;
    startRoom.hasBeenRevealed = true;

    this.initEvents();
  }

  public getSaveDataSnapshot() {
    const clearedRoomIds: string[] = [];
    const visitedRoomIds: string[] = [];
    this.dungeon.rooms.forEach((room) => {
      if (room.isCleared) clearedRoomIds.push(room.id);
      if (room.isVisited) visitedRoomIds.push(room.id);
    });

    return {
      floorLevel: this.dungeon.floorLevel,
      seed: this.dungeon.seed,
      playerX: Math.round(this.player.x),
      playerY: Math.round(this.player.y),
      currentRoomId: this.player.currentRoomId,
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      ammo: this.player.ammo,
      explosivesAmmo: this.player.explosivesAmmo,
      intelCollected: this.player.intelCollected,
      clearedRoomIds,
      visitedRoomIds,
    };
  }

  private initEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) ||
      (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'))
    ) {
      return;
    }
    if (this.isPaused) return;

    // Evitar que las flechas direccionales o barra espaciadora hagan scroll en la página
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    this.keys[e.code] = true;

    if (e.code === 'KeyR' && !this.player.isReloading && this.player.magAmmo < this.player.magCapacity && this.player.ammo > 0) {
      this.startReload();
    }
    if (e.code === 'Space' && this.player.dashCooldown <= 0 && !this.player.isDashing) {
      this.triggerDash();
    }
    if (e.code === 'Digit1') {
      this.player.activeWeaponSlot = 1;
    }
    if (e.code === 'Digit2') {
      this.player.activeWeaponSlot = 2;
    }
    if (e.code === 'KeyQ') {
      this.fireExplosive();
    }
    if (e.code === 'KeyT') {
      this.showPathGuide = !this.showPathGuide;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) ||
      (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'))
    ) {
      return;
    }
    if (this.isPaused) {
      this.keys[e.code] = false;
      return;
    }
    this.keys[e.code] = false;
  };

  public triggerDash() {
    if (this.player.dashCooldown > 0) return;
    this.player.isDashing = true;
    this.player.dashTimer = 0.18;
    this.player.dashCooldown = 0.7;
    this.screenShake = Math.max(this.screenShake, 5);
    sound.playDash();

    // Dust puffs
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        color: '#f7fafc',
        size: Math.random() * 4 + 3,
        alpha: 0.9,
        decay: 3.5,
        shape: 'smoke',
      });
    }
  }

  public swingKatanaOrShoot() {
    if (this.slashCooldown > 0) return;
    this.slashCooldown = 0.28;
    this.player.isSwinging = true;
    this.player.swingProgress = 0;

    this.screenShake = Math.max(this.screenShake, 5);
    sound.playSuppressedShot(); // Melee slice swoosh sound

    // Katana slice hit-check in front of player
    const sliceRange = 36;
    const sliceAngle = this.player.angle;
    const currentRoom = this.dungeon.rooms.get(this.player.currentRoomId);

    // Deflect / destroy enemy projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.fromPlayer) {
        const dX = p.x - this.player.x;
        const dY = p.y - this.player.y;
        if (Math.hypot(dX, dY) < sliceRange + 10) {
          // Deflect projectile back towards aim!
          p.fromPlayer = true;
          p.vx = Math.cos(sliceAngle) * 550;
          p.vy = Math.sin(sliceAngle) * 550;
          this.createSparks(p.x, p.y, '#ffffff');
        }
      }
    }

    // Damage enemies with Katana
    if (currentRoom) {
      for (const guard of currentRoom.guards) {
        if (guard.state === 'dead') continue;
        const dX = guard.x - this.player.x;
        const dY = guard.y - this.player.y;
        const dist = Math.hypot(dX, dY);
        if (dist < sliceRange + 8) {
          const angleToGuard = Math.atan2(dY, dX);
          const diff = Math.abs(this.normalizeAngle(angleToGuard - sliceAngle));
          if (diff < 1.3) {
            guard.health -= 40;
            guard.state = 'alert';
            this.createSparks(guard.x, guard.y, '#ff2020');
            this.screenShake = 7;

            if (guard.health <= 0) {
              guard.state = 'dead';
              this.spawnRadDrops(guard.x, guard.y, 3);
            }
          }
        }
      }

      // Hit boss
      if (currentRoom.boss && !currentRoom.boss.defeated) {
        const boss = currentRoom.boss;
        const dist = Math.hypot(boss.x - this.player.x, boss.y - this.player.y);
        if (dist < sliceRange + 16) {
          boss.health -= 30;
          this.createSparks(boss.x, boss.y, '#ff2020');
          this.screenShake = 8;
          if (boss.health <= 0) {
            boss.defeated = true;
            this.spawnRadDrops(boss.x, boss.y, 8);
          }
        }
      }
    }

    // Also fire bullet if has revolver ammo
    if (this.player.magAmmo > 0) {
      this.shootBullet();
    }
  }

  /**
   * Instancia y dispara proyectiles en la dirección especificada por las flechitas,
   * adaptando el número de proyectiles, dispersión, velocidad, daño, retroceso y sonido
   * según el arma avanzada equipada por el Agente 007.
   */
  public fireProjectileInDirection(dirX: number, dirY: number) {
    const len = Math.hypot(dirX, dirY);
    if (len === 0) return;
    const normX = dirX / len;
    const normY = dirY / len;
    const angle = Math.atan2(normY, normX);

    this.player.angle = angle;
    const weapon = getWeaponDef(this.player.currentWeapon);

    // Retroceso dinámico y pantalla sacudida según calibre del arma
    this.screenShake = Math.max(this.screenShake, weapon.recoil);

    // Efecto de audio diferenciado por arma
    if (this.player.currentWeapon === 'shotgun') {
      sound.playShotgunShot();
    } else if (this.player.currentWeapon === 'laser') {
      sound.playLaserShot();
    } else if (this.player.currentWeapon === 'plasma') {
      sound.playPlasmaShot();
    } else {
      sound.playSuppressedShot();
    }

    // Desvío / parada táctica de proyectiles enemigos cercanos al disparar
    const sliceRange = 36;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.fromPlayer) {
        const dX = p.x - this.player.x;
        const dY = p.y - this.player.y;
        if (Math.hypot(dX, dY) < sliceRange + 8) {
          p.fromPlayer = true;
          p.vx = Math.cos(angle) * 550;
          p.vy = Math.sin(angle) * 550;
          this.createSparks(p.x, p.y, '#ffffff');
        }
      }
    }

    // Gestión de munición del cargador
    const ammoUsed = Math.min(weapon.ammoCost, Math.max(1, this.player.magAmmo));
    if (this.player.magAmmo > 0) {
      this.player.magAmmo = Math.max(0, this.player.magAmmo - ammoUsed);
      if (this.player.magAmmo === 0 && !this.player.isReloading && this.player.ammo > 0) {
        this.startReload();
      }
    } else if (!this.player.isReloading && this.player.ammo > 0) {
      this.startReload();
    }

    // Instanciación de proyectiles según el patrón del arma (Escopeta dispara múltiples perdigones)
    const count = weapon.projectilesPerShot;
    for (let i = 0; i < count; i++) {
      let pelletAngle = angle;
      if (count > 1) {
        const fraction = (i / (count - 1)) - 0.5; // Abanico simétrico centrado
        pelletAngle = angle + fraction * weapon.spread + (Math.random() - 0.5) * 0.05;
      } else {
        pelletAngle = angle + (Math.random() - 0.5) * weapon.spread;
      }

      const pSpeed = weapon.speed * (0.94 + Math.random() * 0.12);
      const bx = this.player.x + Math.cos(pelletAngle) * 18;
      const by = this.player.y + Math.sin(pelletAngle) * 18;

      this.projectiles.push({
        id: Math.random().toString(),
        x: bx,
        y: by,
        vx: Math.cos(pelletAngle) * pSpeed,
        vy: Math.sin(pelletAngle) * pSpeed,
        fromPlayer: true,
        damage: weapon.damage,
        distanceTravelled: 0,
        maxDistance: weapon.maxDistance,
        weaponType: this.player.currentWeapon,
        color: weapon.color,
        glowColor: weapon.glowColor,
      });
    }

    // Muzzle flash y casquillos según tecnología del arma
    const muzzleX = this.player.x + Math.cos(angle) * 20;
    const muzzleY = this.player.y + Math.sin(angle) * 20;

    if (this.player.currentWeapon === 'shotgun') {
      // Destello de pólvora y doble casquillo rojo
      this.createSparks(muzzleX, muzzleY, '#ea580c');
      this.createSparks(muzzleX, muzzleY, '#f97316');
      for (let k = 0; k < 2; k++) {
        const cAngle = angle - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
        this.casings.push({
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(cAngle) * (70 + Math.random() * 30),
          vy: Math.sin(cAngle) * (70 + Math.random() * 30),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 20,
        });
      }
    } else if (this.player.currentWeapon === 'laser') {
      // Descarga fotónica azul / cian sin casquillos
      this.createSparks(muzzleX, muzzleY, '#38bdf8');
      this.createSparks(muzzleX, muzzleY, '#ffffff');
    } else if (this.player.currentWeapon === 'plasma') {
      // Orbe de plasma verde esmeralda ionizado
      this.createSparks(muzzleX, muzzleY, '#22c55e');
      this.createSparks(muzzleX, muzzleY, '#86efac');
    } else {
      // Walther PPK 9mm Silenciada reglamentaria
      this.createSparks(muzzleX, muzzleY, '#ffdd44');
      const cAngle = angle - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      this.casings.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(cAngle) * 80,
        vy: Math.sin(cAngle) * 80,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
      });
    }
  }

  private shootBullet() {
    this.player.magAmmo--;
    const speed = 700;
    const spread = (Math.random() - 0.5) * 0.08;
    const angle = this.player.angle + spread;

    const bx = this.player.x + Math.cos(angle) * 16;
    const by = this.player.y + Math.sin(angle) * 16;

    this.projectiles.push({
      id: Math.random().toString(),
      x: bx,
      y: by,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fromPlayer: true,
      damage: 3,
      distanceTravelled: 0,
      maxDistance: 600,
    });

    // Eject Brass Casing
    const cAngle = this.player.angle - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    this.casings.push({
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(cAngle) * 80,
      vy: Math.sin(cAngle) * 80,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 15,
    });
  }

  public fireExplosive() {
    if (this.player.explosivesAmmo <= 0) return;
    this.player.explosivesAmmo--;
    this.screenShake = 9;
    sound.playEmpPulse();

    const speed = 460;
    const angle = this.player.angle;
    const bx = this.player.x + Math.cos(angle) * 18;
    const by = this.player.y + Math.sin(angle) * 18;

    this.projectiles.push({
      id: Math.random().toString(),
      x: bx,
      y: by,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fromPlayer: true,
      damage: 8,
      isEmp: true, // triggers explosion on impact
      distanceTravelled: 0,
      maxDistance: 500,
    });
  }

  public startReload() {
    this.player.isReloading = true;
    this.player.reloadProgress = 0;
    sound.playReload();
  }

  public spawnRadDrops(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 50 + 20;
      this.radDrops.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        value: 1,
        lifetime: 15.0,
      });
    }
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    if (this.isTransitioning || this.isPaused) return;
    this.gameTime += dt;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Katana swing animation update
    if (this.player.isSwinging) {
      this.player.swingProgress += dt * 6.0;
      if (this.player.swingProgress >= 1.0) {
        this.player.isSwinging = false;
        this.player.swingProgress = 0;
      }
    }
    if (this.slashCooldown > 0) {
      this.slashCooldown -= dt;
    }

    // 1. DISPARO CON FLECHITAS (Exclusivo con ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
    let shootX = 0;
    let shootY = 0;
    if (this.keys['ArrowUp']) shootY -= 1;
    if (this.keys['ArrowDown']) shootY += 1;
    if (this.keys['ArrowLeft']) shootX -= 1;
    if (this.keys['ArrowRight']) shootX += 1;

    const isShootingWithArrows = shootX !== 0 || shootY !== 0;

    if (this.shootCooldownTimer > 0) {
      this.shootCooldownTimer -= dt;
    }

    if (isShootingWithArrows) {
      // Apunta en la dirección indicada por las flechitas (8 direcciones)
      this.player.angle = Math.atan2(shootY, shootX);

      // Disparo automático continuo respetando la cadencia de fuego (Fire Rate)
      if (this.shootCooldownTimer <= 0) {
        this.fireProjectileInDirection(shootX, shootY);
        const curW = getWeaponDef(this.player.currentWeapon);
        this.shootCooldownTimer = curW.fireRate;
      }
    }

    // 2. MOVIMIENTO ESTRICTAMENTE CON WASD (8 DIRECCIONES CON NORMALIZACIÓN DE VECTOR)
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW']) moveY -= 1;
    if (this.keys['KeyS']) moveY += 1;
    if (this.keys['KeyA']) moveX -= 1;
    if (this.keys['KeyD']) moveX += 1;

    // Normalizar vector para evitar mayor velocidad en las diagonales (1.414 -> 1.0)
    const moveLen = Math.hypot(moveX, moveY);
    if (moveLen > 0) {
      moveX /= moveLen;
      moveY /= moveLen;
    }

    // Si no está disparando con flechitas, el personaje se orienta hacia la dirección que camina
    if (!isShootingWithArrows && (moveX !== 0 || moveY !== 0)) {
      this.player.angle = Math.atan2(moveY, moveX);
    }

    const isMoving = moveX !== 0 || moveY !== 0;
    if (isMoving) {
      this.player.walkCycle += dt;
      // Kick up occasional dust puff
      if (Math.random() < 0.25) {
        this.particles.push({
          x: this.player.x - Math.cos(this.player.angle) * 8 + (Math.random() - 0.5) * 6,
          y: this.player.y + 6 + (Math.random() - 0.5) * 3,
          vx: (Math.random() - 0.5) * 15,
          vy: -Math.random() * 10,
          color: '#ffffff',
          size: Math.random() * 3 + 2,
          alpha: 0.7,
          decay: 2.5,
          shape: 'smoke',
        });
      }
    }

    let speed = 150;
    if (this.player.isDashing) speed = 390;

    if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;
    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) this.player.isDashing = false;
    }

    if (this.player.isReloading) {
      this.player.reloadProgress += dt / 1.1;
      if (this.player.reloadProgress >= 1) {
        this.player.isReloading = false;
        const needed = this.player.magCapacity - this.player.magAmmo;
        const available = Math.min(needed, this.player.ammo);
        this.player.magAmmo += available;
        this.player.ammo -= available;
      }
    }

    this.player.vx = moveX * speed;
    this.player.vy = moveY * speed;

    const nextX = this.player.x + this.player.vx * dt;
    const nextY = this.player.y + this.player.vy * dt;

    if (!this.checkWallCollision(nextX, this.player.y, 9)) {
      this.player.x = nextX;
    }
    if (!this.checkWallCollision(this.player.x, nextY, 9)) {
      this.player.y = nextY;
    }

    this.updateCurrentRoom();

    // Camera follow smoothly
    this.cameraX += (this.player.x - this.cameraX) * 0.16;
    this.cameraY += (this.player.y - this.cameraY) * 0.16;

    // Bullet Casings
    for (const c of this.casings) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.rotationSpeed * dt;
      c.vx *= 0.88;
      c.vy *= 0.88;
      c.rotationSpeed *= 0.88;
    }
    if (this.casings.length > 50) this.casings.splice(0, this.casings.length - 50);

    // Rad Drops Magnetism & Collection
    for (let i = this.radDrops.length - 1; i >= 0; i--) {
      const rad = this.radDrops[i];
      rad.lifetime -= dt;
      rad.x += rad.vx * dt;
      rad.y += rad.vy * dt;
      rad.vx *= 0.94;
      rad.vy *= 0.94;

      const dX = this.player.x - rad.x;
      const dY = this.player.y - rad.y;
      const dist = Math.hypot(dX, dY);

      // Magnet towards player if close (generous radius for smooth pickup)
      if (dist < 150) {
        const pull = (150 - dist) * 8.5;
        rad.vx += (dX / dist) * pull * dt;
        rad.vy += (dY / dist) * pull * dt;
      }

      // Collect distance (increased hitbox from 14px to 34px)
      if (dist < 34) {
        this.player.intelCollected += rad.value;
        sound.playPickup();
        this.radDrops.splice(i, 1);
        if (this.callbacks.onIntelFound) this.callbacks.onIntelFound(this.player.intelCollected);
      } else if (rad.lifetime <= 0) {
        this.radDrops.splice(i, 1);
      }
    }

    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateRoomEntities(dt);
    this.updateLockdown(dt);
    this.checkElevatorInteract();
  }

  private updateCurrentRoom() {
    const roomWidthPx = ROOM_WIDTH * TILE_SIZE;
    const roomHeightPx = ROOM_HEIGHT * TILE_SIZE;

    for (const [id, room] of this.dungeon.rooms.entries()) {
      const rx = room.bounds.worldX;
      const ry = room.bounds.worldY;

      if (
        this.player.x >= rx &&
        this.player.x < rx + roomWidthPx &&
        this.player.y >= ry &&
        this.player.y < ry + roomHeightPx
      ) {
        if (this.player.currentRoomId !== id) {
          this.player.currentRoomId = id;
          room.isVisited = true;
          room.hasBeenRevealed = true;
          sound.playDoorSlide();
          if (this.callbacks.onRoomEntered) this.callbacks.onRoomEntered(room);

          for (const door of Object.values(room.doors)) {
            if (door && door.targetRoomId) {
              const neighbor = this.dungeon.rooms.get(door.targetRoomId);
              if (neighbor) neighbor.hasBeenRevealed = true;
            }
          }
        }
        break;
      }
    }
  }

  private updateRoomEntities(dt: number) {
    const currentRoom = this.dungeon.rooms.get(this.player.currentRoomId);
    if (!currentRoom) return;

    // Enemies (Bandits, Scorpions, Snipers)
    for (const guard of currentRoom.guards) {
      if (guard.state === 'dead') continue;
      if (guard.shootCooldown > 0) guard.shootCooldown -= dt;

      const dX = this.player.x - guard.x;
      const dY = this.player.y - guard.y;
      const dist = Math.hypot(dX, dY);

      let canSee = dist < guard.fovDistance;
      if (canSee) {
        guard.state = 'alert';
        guard.angle = Math.atan2(dY, dX);

        if (dist > 90) {
          const gx = guard.x + Math.cos(guard.angle) * guard.speed * dt;
          const gy = guard.y + Math.sin(guard.angle) * guard.speed * dt;
          if (!this.checkWallCollision(gx, guard.y, 10)) guard.x = gx;
          if (!this.checkWallCollision(guard.x, gy, 10)) guard.y = gy;
        }

        if (guard.shootCooldown <= 0) {
          guard.shootCooldown = 1.3;
          sound.playEnemyShot();
          this.projectiles.push({
            id: Math.random().toString(),
            x: guard.x + Math.cos(guard.angle) * 14,
            y: guard.y + Math.sin(guard.angle) * 14,
            vx: Math.cos(guard.angle) * 380,
            vy: Math.sin(guard.angle) * 380,
            fromPlayer: false,
            damage: 1,
            distanceTravelled: 0,
            maxDistance: 450,
          });
        }
      }
    }

    // Boss
    if (currentRoom.boss && !currentRoom.boss.defeated) {
      const boss = currentRoom.boss;
      const dX = this.player.x - boss.x;
      const dY = this.player.y - boss.y;
      boss.angle = Math.atan2(dY, dX);
      boss.attackCooldown -= dt;

      if (boss.attackCooldown <= 0) {
        boss.attackCooldown = 1.6;
        sound.playEnemyShot();
        this.screenShake = 6;
        for (const spr of [-0.25, 0, 0.25]) {
          const a = boss.angle + spr;
          this.projectiles.push({
            id: Math.random().toString(),
            x: boss.x + Math.cos(a) * 24,
            y: boss.y + Math.sin(a) * 24,
            vx: Math.cos(a) * 360,
            vy: Math.sin(a) * 360,
            fromPlayer: false,
            damage: 2,
            distanceTravelled: 0,
            maxDistance: 500,
          });
        }
      }
    }

    // 1. Pickups & Proximity Legends (Explaining why an item cannot be picked up)
    let currentLegend: string | null = null;

    for (let i = currentRoom.items.length - 1; i >= 0; i--) {
      const item = currentRoom.items[i];
      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);

      // Distance to show informative explanation banner (< 75px)
      if (dist < 75) {
        if (item.type === 'ammo') {
          if (this.player.ammo >= this.player.maxAmmo) {
            currentLegend = `NO PUEDES RECOGER MUNICIÓN: Capacidad máxima alcanzada (${this.player.ammo}/${this.player.maxAmmo} balas). Dispara para liberar espacio.`;
          } else {
            currentLegend = `MUNICIÓN (+12 BALAS 9MM): Písala para recargar munición de reserva.`;
          }
        } else if (item.type === 'explosives') {
          if (this.player.explosivesAmmo >= 99) {
            currentLegend = `NO PUEDES RECOGER EXPLOSIVOS: Capacidad de explosivos llena (${this.player.explosivesAmmo}/99).`;
          } else {
            currentLegend = `EXPLOSIVOS (+6): Písalos para recoger cargas explosivas.`;
          }
        } else if (item.type === 'medkit') {
          if (this.player.health >= this.player.maxHealth) {
            currentLegend = `NO PUEDES RECOGER BOTIQUÍN: Tu salud ya está al máximo (${this.player.health}/${this.player.maxHealth} HP).`;
          } else {
            currentLegend = `BOTIQUÍN DE PRIMEROS AUXILIOS (+4 HP): Písalo para restaurar vida.`;
          }
        } else if (item.type === 'intel') {
          currentLegend = `INTEL / RADS (+5): Documentos confidenciales de la base enemiga.`;
        } else if (item.type === 'weapon') {
          const wDef = getWeaponDef(item.weaponType || 'shotgun');
          currentLegend = `[ARMA AVANZADA] ${wDef.name.toUpperCase()} (${wDef.fireMode}): Písala para equiparla y cambiar tu estilo de ataque.`;
        }
      }

      // Touch / Collect distance (< 48px - enlarged hitbox for smooth pickup)
      if (dist < 48) {
        if (item.type === 'ammo') {
          if (this.player.ammo < this.player.maxAmmo) {
            sound.playPickup();
            this.player.ammo = Math.min(this.player.maxAmmo, this.player.ammo + 12);
            currentRoom.items.splice(i, 1);
            this.addFloatingNotice(item.x, item.y, '+12 BALAS', '#f6e05e');
          } else {
            // Cannot pick up because ammo is full! Show clear floating world notice
            this.addFloatingNotice(item.x, item.y - 10, 'MUNICIÓN LLENA (99/99)', '#ef4444');
          }
        } else if (item.type === 'explosives') {
          if (this.player.explosivesAmmo < 99) {
            sound.playPickup();
            this.player.explosivesAmmo = Math.min(99, this.player.explosivesAmmo + 6);
            currentRoom.items.splice(i, 1);
            this.addFloatingNotice(item.x, item.y, '+6 EXPLOSIVOS', '#f97316');
          } else {
            this.addFloatingNotice(item.x, item.y - 10, 'EXPLOSIVOS LLENOS', '#ef4444');
          }
        } else if (item.type === 'medkit') {
          if (this.player.health < this.player.maxHealth) {
            sound.playPickup();
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 4);
            currentRoom.items.splice(i, 1);
            this.addFloatingNotice(item.x, item.y, '+4 SALUD', '#22c55e');
          } else {
            this.addFloatingNotice(item.x, item.y - 10, 'SALUD AL MÁXIMO (8/8)', '#ef4444');
          }
        } else if (item.type === 'intel') {
          sound.playPickup();
          this.player.intelCollected += 5;
          currentRoom.items.splice(i, 1);
          this.addFloatingNotice(item.x, item.y, '+5 INTEL', '#4ade80');
        } else if (item.type === 'weapon') {
          const newWeapon = item.weaponType || 'shotgun';
          const wDef = getWeaponDef(newWeapon);
          sound.playWeaponPickup();
          this.player.currentWeapon = newWeapon;
          this.fireRate = wDef.fireRate;
          this.shootCooldownTimer = 0;
          currentRoom.items.splice(i, 1);
          this.addFloatingNotice(item.x, item.y - 12, `¡EQUIPADO: ${wDef.shortName}!`, wDef.color);
          this.screenShake = 4;
          for (let s = 0; s < 14; s++) {
            const sAngle = (s / 14) * Math.PI * 2;
            this.particles.push({
              x: this.player.x,
              y: this.player.y,
              vx: Math.cos(sAngle) * 85,
              vy: Math.sin(sAngle) * 85,
              color: wDef.color,
              size: 3,
              alpha: 1,
              decay: 2.2,
            });
          }
        }
      }
    }

    // Terminals / Consoles (Enlarged interaction distance < 58px)
    for (const term of currentRoom.terminals) {
      const tDist = Math.hypot(this.player.x - term.x, this.player.y - term.y);
      if (tDist < 75) {
        if (term.hacked) {
          if (!currentLegend) currentLegend = 'CONSOLA YA HACKEADA: Protocolos de seguridad anulados.';
        } else {
          if (!currentLegend) currentLegend = `CONSOLA TÁCTICA: Presiona [E] para interactuar y hackear el circuito.`;
        }
      }

      if (tDist < 58 && !term.hacked) {
        if (this.keys['KeyE']) {
          this.keys['KeyE'] = false;
          sound.playHackBeep();
          if (this.callbacks.onTerminalOpen) {
            this.callbacks.onTerminalOpen(term);
          } else {
            term.hackProgress += dt * 60;
            if (term.hackProgress >= 100) {
              term.hacked = true;
              this.spawnRadDrops(term.x, term.y, 4);
              this.addFloatingNotice(term.x, term.y - 10, 'HACKEO COMPLETADO', '#48bb78');
            }
          }
        }
      }
    }

    // Boss Portal Proximity Legend
    if (currentRoom.type === 'BOSS') {
      const bossDead = !currentRoom.boss || currentRoom.boss.defeated;
      const elX = currentRoom.bounds.worldX + CENTER_TILE.x * TILE_SIZE + TILE_SIZE / 2;
      const elY = currentRoom.bounds.worldY + CENTER_TILE.y * TILE_SIZE + TILE_SIZE / 2;
      if (Math.hypot(this.player.x - elX, this.player.y - elY) < 55) {
        if (!bossDead) {
          if (!currentLegend) currentLegend = 'PORTAL BLOQUEADO: Neutraliza al Jefe del sector para activar el ascensor.';
        } else {
          if (!currentLegend) currentLegend = 'ASCENSOR HABILITADO: Presiona [E] para descender al siguiente sector.';
        }
      }
    }

    // Door Lockdown Proximity Legend & Combat Feedback
    if (currentRoom.isLockedDown) {
      const doorPositions: Record<Direction, { x: number; y: number }> = {
        N: DOOR_N,
        S: DOOR_S,
        W: DOOR_W,
        E: DOOR_E,
      };

      for (const [dirKey, door] of Object.entries(currentRoom.doors)) {
        if (!door) continue;
        const pos = doorPositions[dirKey as Direction];
        const dwx = currentRoom.bounds.worldX + pos.x * TILE_SIZE + TILE_SIZE / 2;
        const dwy = currentRoom.bounds.worldY + pos.y * TILE_SIZE + TILE_SIZE / 2;
        if (Math.hypot(this.player.x - dwx, this.player.y - dwy) < 55) {
          currentLegend = 'PUERTA BLOQUEADA: Salidas selladas por seguridad. Elimina a todas las amenazas de la sala para abrir el paso.';
          break;
        }
      }

      if (!currentLegend) {
        const remainingEnemies =
          currentRoom.guards.filter((g) => g.state !== 'dead' && g.health > 0).length +
          (currentRoom.boss && !currentRoom.boss.defeated && currentRoom.boss.health > 0 ? 1 : 0);
        currentLegend = `⚠️ COMBATE EN CURSO: Sala bloqueada (${remainingEnemies} ${
          remainingEnemies === 1 ? 'amenaza restante' : 'amenazas restantes'
        }).`;
      }
    }

    this.activeLegend = currentLegend;
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.distanceTravelled += Math.hypot(p.vx * dt, p.vy * dt);

      // Hit wall
      if (this.checkWallCollision(p.x, p.y, 3) || p.distanceTravelled > p.maxDistance) {
        if (p.fromPlayer) {
          this.createWeaponImpact(p.x, p.y, p.weaponType || 'pistol', false);
        } else {
          this.createSparks(p.x, p.y, '#e53e3e');
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit Player
      if (!p.fromPlayer) {
        if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 12) {
          this.damagePlayer(p.damage);
          this.createSparks(p.x, p.y, '#e53e3e');
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Hit Enemy
      if (p.fromPlayer) {
        const currentRoom = this.dungeon.rooms.get(this.player.currentRoomId);
        if (!currentRoom) continue;

        let hit = false;
        for (const g of currentRoom.guards) {
          if (g.state === 'dead') continue;
          if (Math.hypot(p.x - g.x, p.y - g.y) < 15) {
            g.health -= p.damage * 15;
            g.state = 'alert';
            this.createWeaponImpact(p.x, p.y, p.weaponType || 'pistol', true);
            if (g.health <= 0) {
              g.state = 'dead';
              this.spawnRadDrops(g.x, g.y, 2);
              // Chance to drop an advanced weapon from defeated guards
              if (g.isHeavy || Math.random() < 0.25) {
                const pool: WeaponType[] = ['shotgun', 'laser', 'plasma'];
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const wDef = getWeaponDef(pick);
                currentRoom.items.push({
                  id: `drop_w_${Math.random().toString(36).substr(2, 6)}`,
                  x: g.x,
                  y: g.y,
                  type: 'weapon',
                  weaponType: pick,
                  name: wDef.name,
                  amount: 1,
                });
              }
            }
            hit = true;
            break;
          }
        }

        if (!hit && currentRoom.boss && !currentRoom.boss.defeated) {
          const boss = currentRoom.boss;
          if (Math.hypot(p.x - boss.x, p.y - boss.y) < 24) {
            boss.health -= p.damage * 10;
            this.createWeaponImpact(p.x, p.y, p.weaponType || 'pistol', true);
            if (boss.health <= 0) {
              boss.defeated = true;
              this.spawnRadDrops(boss.x, boss.y, 8);
              // Boss drops advanced heavy weapon reward
              const pool: WeaponType[] = ['laser', 'plasma'];
              const pick = pool[Math.floor(Math.random() * pool.length)];
              const wDef = getWeaponDef(pick);
              currentRoom.items.push({
                id: `boss_drop_w_${Math.random().toString(36).substr(2, 6)}`,
                x: boss.x,
                y: boss.y,
                type: 'weapon',
                weaponType: pick,
                name: wDef.name,
                amount: 1,
              });
            }
            hit = true;
          }
        }

        if (hit) {
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  public createWeaponImpact(x: number, y: number, weaponType: WeaponType = 'pistol', isEnemy: boolean = true) {
    if (weaponType === 'shotgun') {
      sound.playShotgunImpact();
      this.screenShake = Math.max(this.screenShake, 5);
      // Kinetic combustion sparks and fiery shrapnel
      for (let s = 0; s < 9; s++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 140;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: Math.random() > 0.5 ? '#f97316' : '#ea580c',
          size: Math.random() * 2.5 + 1.5,
          alpha: 1,
          decay: 2.8,
        });
      }
      // Smoke puff
      for (let sm = 0; sm < 3; sm++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 20,
          vy: -15 - Math.random() * 20,
          color: '#71717a',
          size: 4,
          alpha: 0.6,
          decay: 1.2,
        });
      }
    } else if (weaponType === 'laser') {
      sound.playLaserImpact();
      this.screenShake = Math.max(this.screenShake, 2);
      // High-velocity cyan ionizing electric sparks
      for (let s = 0; s < 8; s++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 120 + Math.random() * 180;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: Math.random() > 0.4 ? '#38bdf8' : '#ffffff',
          size: 2,
          alpha: 1,
          decay: 3.8,
        });
      }
    } else if (weaponType === 'plasma') {
      sound.playPlasmaShot();
      this.screenShake = Math.max(this.screenShake, 6);
      // Emerald plasma detonation
      for (let s = 0; s < 12; s++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 120;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: Math.random() > 0.4 ? '#22c55e' : '#86efac',
          size: Math.random() * 3 + 2,
          alpha: 1,
          decay: 2.2,
        });
      }
      // Radial splash damage on nearby enemies within 34px
      if (isEnemy) {
        const currentRoom = this.dungeon.rooms.get(this.player.currentRoomId);
        if (currentRoom) {
          for (const g of currentRoom.guards) {
            if (g.state === 'dead') continue;
            const dist = Math.hypot(g.x - x, g.y - y);
            if (dist > 0 && dist < 34) {
              g.health -= 35;
              g.state = 'alert';
              if (g.health <= 0) {
                g.state = 'dead';
                this.spawnRadDrops(g.x, g.y, 2);
              }
            }
          }
        }
      }
    } else {
      // Default Silenced Pistol
      this.createSparks(x, y, isEnemy ? '#ffffff' : '#f6e05e');
      this.screenShake = Math.max(this.screenShake, 3);
    }
  }

  public damagePlayer(amt: number) {
    if (this.player.isDashing) return;
    this.screenShake = 12;
    this.player.health = Math.max(0, this.player.health - amt);
    if (this.player.health <= 0 && this.callbacks.onPlayerDied) {
      this.callbacks.onPlayerDied();
    }
  }

  private checkElevatorInteract() {
    const currentRoom = this.dungeon.rooms.get(this.player.currentRoomId);
    if (currentRoom && currentRoom.type === 'BOSS') {
      const bossDead = !currentRoom.boss || currentRoom.boss.defeated;
      const elX = currentRoom.bounds.worldX + CENTER_TILE.x * TILE_SIZE + TILE_SIZE / 2;
      const elY = currentRoom.bounds.worldY + CENTER_TILE.y * TILE_SIZE + TILE_SIZE / 2;
      if (Math.hypot(this.player.x - elX, this.player.y - elY) < 36 && bossDead) {
        if (this.keys['KeyE'] && !this.isTransitioning) {
          this.isTransitioning = true;
          if (this.callbacks.onFloorCleared) this.callbacks.onFloorCleared();
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= (pt.decay || 3.0) * dt;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }

    // Update floating world notices
    for (let i = this.floatingNotices.length - 1; i >= 0; i--) {
      const fn = this.floatingNotices[i];
      fn.y -= dt * 16;
      fn.life -= dt;
      if (fn.life <= 0) this.floatingNotices.splice(i, 1);
    }
  }

  private createSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 60 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color,
        size: 3,
        alpha: 1,
        decay: 4.5,
        shape: 'spark',
      });
    }
  }

  private checkWallCollision(worldX: number, worldY: number, radius: number): boolean {
    for (const room of this.dungeon.rooms.values()) {
      const rb = room.bounds;
      if (
        worldX + radius >= rb.worldX &&
        worldX - radius <= rb.worldX + rb.width &&
        worldY + radius >= rb.worldY &&
        worldY - radius <= rb.worldY + rb.height
      ) {
        const tx = Math.floor((worldX - rb.worldX) / TILE_SIZE);
        const ty = Math.floor((worldY - rb.worldY) / TILE_SIZE);

        if (tx >= 0 && tx < ROOM_WIDTH && ty >= 0 && ty < ROOM_HEIGHT) {
          const tile = room.tiles[ty][tx];
          if (!tile.walkable) return true;
        }
      }
    }
    return false;
  }

  private normalizeAngle(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // ==================== RENDERING (EXACT NUCLEAR THRONE AESTHETIC) ====================
  public render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.imageSmoothingEnabled = false;

    // Clear background with deep dark desert rock
    ctx.fillStyle = '#1c150e';
    ctx.fillRect(0, 0, w, h);

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake * 1.5;
      shakeY = (Math.random() - 0.5) * this.screenShake * 1.5;
    }

    ctx.save();
    // Center camera with zoom for chunky pixels
    ctx.translate(Math.round(w / 2 + shakeX), Math.round(h / 2 + shakeY));
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // 1. Draw Rooms (Warm Desert Sand, Mesa Cliffs with Crag Teeth)
    for (const room of this.dungeon.rooms.values()) {
      this.renderNuclearThroneRoom(room);
    }

    // 2. Draw Brass Bullet Casings on Floor
    for (const c of this.casings) {
      ctx.save();
      ctx.translate(Math.floor(c.x), Math.floor(c.y));
      ctx.rotate(c.rotation);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-2, -1, 4, 2);
      ctx.fillStyle = '#d69e2e';
      ctx.fillRect(-1, 0, 2, 1);
      ctx.restore();
    }

    // 3. Guaranteed Transitable Path (Neon Rad Waypoint Trail)
    if (this.showPathGuide) {
      this.renderGuaranteedPath();
    }

    // 4. Draw Green Rad Drops
    for (const rad of this.radDrops) {
      drawRadPellet(ctx, rad.x, rad.y);
    }

    // 5. Draw Projectiles (Weapon-specific visuals: Shotgun pellets, Laser beam pulses, Plasma orbs)
    for (const p of this.projectiles) {
      drawCustomProjectile(ctx, p, this.gameTime);
    }

    // 6. Draw Dust / Sparks
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.floor(pt.x) - 1, Math.floor(pt.y) - 1, Math.floor(pt.size), Math.floor(pt.size));
      ctx.restore();
    }

    // 7. Draw Agent 007 Protagonist (Black Tuxedo, Bowtie, Equipped Weapon Model / Katana)
    const isMoving = (this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']);
    drawAgent007Player(
      ctx,
      this.player.x,
      this.player.y,
      this.player.angle,
      this.player.walkCycle,
      !!isMoving,
      this.player.isSwinging,
      this.player.swingProgress,
      this.player.currentWeapon
    );

    // 8. Draw Floating World Notices (e.g. +12 BALAS, or MUNICIÓN LLENA)
    for (const fn of this.floatingNotices) {
      ctx.save();
      const alpha = Math.min(1, fn.life / 0.35);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';

      const tw = ctx.measureText(fn.text).width;
      ctx.fillStyle = '#000000';
      ctx.fillRect(Math.floor(fn.x - tw / 2 - 2), Math.floor(fn.y - 8), Math.ceil(tw + 4), 10);

      ctx.fillStyle = fn.color;
      ctx.fillText(fn.text, Math.floor(fn.x), Math.floor(fn.y));
      ctx.restore();
    }

    ctx.restore();

    // 9. Retícula táctica direccional frente al personaje (basada en orientación de teclado, sin ratón)
    const aimWorldX = this.player.x + Math.cos(this.player.angle) * 42;
    const aimWorldY = this.player.y + Math.sin(this.player.angle) * 42;
    const screenAimX = (aimWorldX - this.cameraX) * this.zoom + this.canvas.width / 2;
    const screenAimY = (aimWorldY - this.cameraY) * this.zoom + this.canvas.height / 2;
    drawNuclearCrosshair(ctx, screenAimX, screenAimY);
  }

  private renderNuclearThroneRoom(room: RoomInstance) {
    const ctx = this.ctx;
    const rb = room.bounds;

    if (!room.isVisited && !room.hasBeenRevealed) return;

    // A. Warm Desert Sand Ground (#dfc37a from screenshot)
    ctx.fillStyle = '#dfc37a';
    ctx.fillRect(rb.worldX, rb.worldY, rb.width, rb.height);

    // Subtle desert dune waves in darker sand (#cca95a)
    ctx.fillStyle = '#cca95a';
    for (let y = 0; y < ROOM_HEIGHT; y += 3) {
      const startX = rb.worldX + ((y * 47) % 60);
      ctx.fillRect(startX, rb.worldY + y * TILE_SIZE + 8, 32, 2);
      ctx.fillRect(startX + 40, rb.worldY + y * TILE_SIZE + 10, 24, 2);
    }

    // B. Tiles (Mesa Cliffs, Cacti, Carcasses, Chests)
    for (let ty = 0; ty < ROOM_HEIGHT; ty++) {
      for (let tx = 0; tx < ROOM_WIDTH; tx++) {
        const tile = room.tiles[ty][tx];
        const wx = rb.worldX + tx * TILE_SIZE;
        const wy = rb.worldY + ty * TILE_SIZE;

        if (tile.type === 'wall') {
          // Nuclear Throne Desert Mesa / Cliff Wall:
          // 1. Cliff Top (Flat khaki stone #bfa87a)
          ctx.fillStyle = '#000000';
          ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#bfa87a';
          ctx.fillRect(wx + 1, wy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

          // Crag texture & specs on cliff top
          ctx.fillStyle = '#8f7b54';
          ctx.fillRect(wx + 4, wy + 5, 3, 2);
          ctx.fillRect(wx + 18, wy + 12, 4, 2);

          // 2. Downward Cliff Face Crag Ridge (if tile below is walkable floor)
          const tileBelow = ty < ROOM_HEIGHT - 1 ? room.tiles[ty + 1][tx] : null;
          if (tileBelow && tileBelow.type !== 'wall') {
            // Front shadow & crag drop
            ctx.fillStyle = '#776344';
            ctx.fillRect(wx + 1, wy + TILE_SIZE - 8, TILE_SIZE - 2, 7);
            // Jagged tooth crags hanging down
            ctx.fillRect(wx + 3, wy + TILE_SIZE - 1, 4, 3);
            ctx.fillRect(wx + 13, wy + TILE_SIZE - 1, 6, 4);
            ctx.fillRect(wx + 23, wy + TILE_SIZE - 1, 3, 2);
          }
        } else if (tile.type === 'cover') {
          drawExplosivesChest(ctx, wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
        } else if (tile.type === 'cactus') {
          drawSaguaroCactus(ctx, wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
        } else if (tile.type === 'barrel_cactus') {
          drawBarrelCactus(ctx, wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
        } else if (tile.type === 'carcass') {
          drawBoneCarcass(ctx, wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
        } else if (tile.type === 'elevator') {
          // Exit Portal
          ctx.fillStyle = '#000000';
          ctx.fillRect(wx - 1, wy - 1, TILE_SIZE + 2, TILE_SIZE + 2);
          ctx.fillStyle = '#48bb78';
          ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#9ae6b4';
          ctx.fillRect(wx + 4, wy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
      }
    }

    // Draw Animated Heavy Blast Security Doors
    const doorPositions: Record<Direction, { x: number; y: number }> = {
      N: DOOR_N,
      S: DOOR_S,
      W: DOOR_W,
      E: DOOR_E,
    };
    for (const [dirKey, door] of Object.entries(room.doors)) {
      if (!door) continue;
      const dir = dirKey as Direction;
      const pos = doorPositions[dir];
      const dwx = rb.worldX + pos.x * TILE_SIZE;
      const dwy = rb.worldY + pos.y * TILE_SIZE;
      const anim = room.doorAnimProgress ?? (door.isLocked ? 1 : 0);
      drawNuclearThroneDoor(ctx, dwx, dwy, dir, anim, door.isLocked);
    }

    // Draw Items
    for (const item of room.items) {
      const dToPlayer = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      const isNearby = dToPlayer < 75;

      // Special rendering for Weapon Pickups
      if (item.type === 'weapon') {
        drawWeaponPickup(ctx, item.x, item.y, item.weaponType || 'shotgun', this.gameTime, isNearby);
        continue;
      }

      // Glowing pickup zone ring indicating the enlarged hitbox
      const auraPulse = Math.sin(this.gameTime * 4 + item.x) * 0.12 + 0.22;
      ctx.save();
      ctx.fillStyle =
        item.type === 'ammo'
          ? `rgba(234, 179, 8, ${auraPulse})`
          : item.type === 'explosives'
          ? `rgba(249, 115, 22, ${auraPulse})`
          : item.type === 'medkit'
          ? `rgba(34, 197, 94, ${auraPulse})`
          : `rgba(56, 189, 248, ${auraPulse})`;
      ctx.beginPath();
      ctx.ellipse(Math.floor(item.x), Math.floor(item.y + 6), 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (item.type === 'ammo' || item.type === 'explosives') {
        drawExplosivesChest(ctx, item.x, item.y);
      } else if (item.type === 'intel') {
        drawRadCanister(ctx, item.x, item.y);
      } else {
        drawPixelRect(ctx, item.x - 5, item.y - 5, 10, 10, item.type === 'medkit' ? '#ff2020' : '#48bb78');
      }

      // Visual indicator if item cannot be collected due to full inventory
      if (isNearby) {
        let badgeText: string | null = null;
        if (item.type === 'ammo' && this.player.ammo >= this.player.maxAmmo) {
          badgeText = '[MUNICIÓN LLENA]';
        } else if (item.type === 'explosives' && this.player.explosivesAmmo >= 99) {
          badgeText = '[EXPLOSIVOS LLENOS]';
        } else if (item.type === 'medkit' && this.player.health >= this.player.maxHealth) {
          badgeText = '[SALUD AL MÁXIMO]';
        }

        if (badgeText) {
          ctx.save();
          ctx.font = 'bold 6px monospace';
          ctx.textAlign = 'center';
          const tw = ctx.measureText(badgeText).width;
          ctx.fillStyle = '#000000';
          ctx.fillRect(Math.floor(item.x - tw / 2 - 2), Math.floor(item.y - 17), Math.ceil(tw + 4), 8);
          ctx.fillStyle = '#ef4444';
          ctx.fillText(badgeText, Math.floor(item.x), Math.floor(item.y - 11));
          ctx.restore();
        }
      }
    }

    // Draw Computer Consoles / Terminals
    for (const term of room.terminals) {
      const dToPlayer = Math.hypot(this.player.x - term.x, this.player.y - term.y);
      const isNearby = dToPlayer < 65;
      drawConsoleTerminal(ctx, term.x, term.y, term.hacked, this.gameTime, isNearby, term.minigameType);
    }

    // Draw Guards (Bandits, Scorpions)
    for (const guard of room.guards) {
      if (guard.state === 'dead') {
        drawBoneCarcass(ctx, guard.x, guard.y);
        continue;
      }
      if (guard.enemyType === 'scorpion') {
        drawScorpion(ctx, guard.x, guard.y, guard.angle, guard.currentPatrolIdx);
      } else {
        drawBandit(ctx, guard.x, guard.y, guard.angle, 0, guard.state === 'alert');
      }
    }

    // Draw Boss
    if (room.boss && !room.boss.defeated) {
      drawScorpion(ctx, room.boss.x, room.boss.y, room.boss.angle, 0);
    }
  }

  // Guaranteed Walkable Waypoint Line
  private renderGuaranteedPath() {
    const ctx = this.ctx;
    const waypoints = this.dungeon.detailedPathWaypoints;
    if (!waypoints || waypoints.length < 2) return;

    ctx.save();
    const time = performance.now() / 1000;
    const dashOffset = -time * 20;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < waypoints.length; i++) {
      if (i === 0) ctx.moveTo(waypoints[i].x, waypoints[i].y);
      else ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#f6e05e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    for (let i = 0; i < waypoints.length; i++) {
      if (i === 0) ctx.moveTo(waypoints[i].x, waypoints[i].y);
      else ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Room Lockdown & Door Mechanics
  public isRoomHostile(room: RoomInstance): boolean {
    const hasAliveGuards = room.guards.some((g) => g.state !== 'dead' && g.health > 0);
    const hasAliveBoss = !!(room.boss && !room.boss.defeated && room.boss.health > 0);
    return hasAliveGuards || hasAliveBoss;
  }

  private setRoomDoorsLocked(room: RoomInstance, locked: boolean) {
    const doorPositions: Record<Direction, { x: number; y: number }> = {
      N: DOOR_N,
      S: DOOR_S,
      W: DOOR_W,
      E: DOOR_E,
    };
    const oppDirs: Record<Direction, Direction> = {
      N: 'S',
      S: 'N',
      E: 'W',
      W: 'E',
    };

    for (const dir of ['N', 'S', 'E', 'W'] as Direction[]) {
      const door = room.doors[dir];
      if (!door) continue;

      door.isLocked = locked;
      door.isOpen = !locked;

      // Update tile in current room
      const pos = doorPositions[dir];
      if (room.tiles[pos.y] && room.tiles[pos.y][pos.x]) {
        room.tiles[pos.y][pos.x].walkable = !locked;
      }

      // Also lock/unlock connecting door in neighbor room
      if (door.targetRoomId) {
        const neighbor = this.dungeon.rooms.get(door.targetRoomId);
        if (neighbor) {
          const oppDir = oppDirs[dir];
          const oppDoor = neighbor.doors[oppDir];
          if (oppDoor) {
            oppDoor.isLocked = locked;
            oppDoor.isOpen = !locked;
          }
          const oppPos = doorPositions[oppDir];
          if (neighbor.tiles[oppPos.y] && neighbor.tiles[oppPos.y][oppPos.x]) {
            neighbor.tiles[oppPos.y][oppPos.x].walkable = !locked;
          }
        }
      }
    }
  }

  private spawnDoorParticles(room: RoomInstance, color: string) {
    const doorPositions: Record<Direction, { x: number; y: number }> = {
      N: DOOR_N,
      S: DOOR_S,
      W: DOOR_W,
      E: DOOR_E,
    };
    for (const [dir, door] of Object.entries(room.doors)) {
      if (!door) continue;
      const pos = doorPositions[dir as Direction];
      const wx = room.bounds.worldX + pos.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = room.bounds.worldY + pos.y * TILE_SIZE + TILE_SIZE / 2;
      this.createSparks(wx, wy, color);
    }
  }

  private updateLockdown(dt: number) {
    const currentRoom = this.dungeon.rooms.get(this.player.currentRoomId);
    if (!currentRoom) return;

    if (currentRoom.doorAnimProgress === undefined) {
      currentRoom.doorAnimProgress = currentRoom.isLockedDown ? 1 : 0;
    }
    if (currentRoom.isLockedDown === undefined) {
      currentRoom.isLockedDown = false;
    }

    const hasHostiles = this.isRoomHostile(currentRoom);

    // Check if player has stepped inside room bounds (past the threshold entrance)
    const relX = this.player.x - currentRoom.bounds.worldX;
    const relY = this.player.y - currentRoom.bounds.worldY;
    const pTx = Math.floor(relX / TILE_SIZE);
    const pTy = Math.floor(relY / TILE_SIZE);
    const isInsideRoom = pTx >= 1 && pTx <= ROOM_WIDTH - 2 && pTy >= 1 && pTy <= ROOM_HEIGHT - 2;

    // 1. TRIGGER LOCKDOWN: Player enters hostile room with alive enemies
    if (!currentRoom.isCleared && hasHostiles && !currentRoom.isLockedDown && isInsideRoom) {
      currentRoom.isLockedDown = true;
      this.setRoomDoorsLocked(currentRoom, true);
      sound.playDoorLock();
      this.screenShake = 6;
      this.spawnDoorParticles(currentRoom, '#ef4444');
      this.addFloatingNotice(
        this.player.x,
        this.player.y - 18,
        '⚠️ ¡SALA BLOQUEADA! ELIMINA A LAS AMENAZAS',
        '#ef4444'
      );
    }

    // 2. CLEAR LOCKDOWN: All threats in current locked room defeated!
    if (currentRoom.isLockedDown && !hasHostiles) {
      currentRoom.isLockedDown = false;
      currentRoom.isCleared = true;
      this.setRoomDoorsLocked(currentRoom, false);
      sound.playDoorUnlock();
      this.screenShake = 3;
      this.spawnDoorParticles(currentRoom, '#48bb78');

      const clearMsg =
        currentRoom.type === 'BOSS'
          ? '🏆 ¡JEFE DERROTADO! ASCENSOR HABILITADO'
          : '✅ ¡SALA DESPEJADA! PUERTAS DESBLOQUEADAS';
      this.addFloatingNotice(this.player.x, this.player.y - 18, clearMsg, '#48bb78');
    }

    // 3. Smoothly animate door progress for all visited rooms
    for (const room of this.dungeon.rooms.values()) {
      if (room.doorAnimProgress === undefined) {
        room.doorAnimProgress = room.isLockedDown ? 1 : 0;
      }
      const targetProgress = room.isLockedDown ? 1.0 : 0.0;
      const speed = room.isLockedDown ? 4.0 : 2.5;
      if (room.doorAnimProgress < targetProgress) {
        room.doorAnimProgress = Math.min(targetProgress, room.doorAnimProgress + dt * speed);
      } else if (room.doorAnimProgress > targetProgress) {
        room.doorAnimProgress = Math.max(targetProgress, room.doorAnimProgress - dt * speed);
      }
    }
  }
}
