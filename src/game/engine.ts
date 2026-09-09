import {
  BossEntity,
  CameraEntity,
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
} from '../types';
import { sound } from './audio';
import { CENTER_TILE, ROOM_HEIGHT, ROOM_WIDTH, TILE_SIZE } from './prefabs';
import {
  drawBandit,
  drawBarrelCactus,
  drawBoneCarcass,
  drawDuckPlayer,
  drawExplosivesChest,
  drawNuclearCrosshair,
  drawPixelRect,
  drawRadCanister,
  drawRadPellet,
  drawSaguaroCactus,
  drawScorpion,
} from './pixelSprites';

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

  // Katana Slash Arc
  public slashCooldown: number = 0;

  // Running loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private callbacks: GameEngineCallbacks;
  public isTransitioning: boolean = false;

  constructor(canvas: HTMLCanvasElement, dungeon: DungeonFloor, callbacks: GameEngineCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dungeon = dungeon;
    this.callbacks = callbacks;

    const startRoom = dungeon.rooms.get(dungeon.startRoomId)!;
    const startX = startRoom.bounds.worldX + CENTER_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const startY = startRoom.bounds.worldY + CENTER_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    this.player = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 8, // Exact 8/8 HP from screenshot
      maxHealth: 8,
      armor: 4,
      maxArmor: 4,
      ammo: 36,
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
      intelCollected: 12, // RAD count
      currentRoomId: dungeon.startRoomId,
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
      explosivesAmmo: 18, // Exact "+18 EXPLOSIVES" from screenshot
      activeWeaponSlot: 2, // Slot "2" from screenshot
    };

    this.cameraX = startX;
    this.cameraY = startY;

    startRoom.isVisited = true;
    startRoom.hasBeenRevealed = true;

    this.initEvents();
  }

  private initEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
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
    this.keys[e.code] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
      this.swingKatanaOrShoot();
    } else if (e.button === 2) {
      e.preventDefault();
      this.fireExplosive();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    }
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
    if (this.isTransitioning) return;

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

    // Convert mouse to world coordinates via camera and zoom
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    this.mouseWorldPos = {
      x: (this.mousePos.x - viewW / 2) / this.zoom + this.cameraX,
      y: (this.mousePos.y - viewH / 2) / this.zoom + this.cameraY,
    };

    this.player.angle = Math.atan2(
      this.mouseWorldPos.y - this.player.y,
      this.mouseWorldPos.x - this.player.x
    );

    // Player Movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
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

      // Magnet towards player if close
      if (dist < 80) {
        const pull = (80 - dist) * 7.0;
        rad.vx += (dX / dist) * pull * dt;
        rad.vy += (dY / dist) * pull * dt;
      }

      if (dist < 14) {
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

    // Pickups
    for (let i = currentRoom.items.length - 1; i >= 0; i--) {
      const item = currentRoom.items[i];
      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < 24) {
        sound.playPickup();
        if (item.type === 'ammo') this.player.ammo = Math.min(99, this.player.ammo + 12);
        if (item.type === 'explosives') this.player.explosivesAmmo = Math.min(99, this.player.explosivesAmmo + 6);
        if (item.type === 'medkit') this.player.health = Math.min(this.player.maxHealth, this.player.health + 4);
        if (item.type === 'intel') this.player.intelCollected += 5;
        currentRoom.items.splice(i, 1);
      }
    }

    // Terminals / Consoles
    for (const term of currentRoom.terminals) {
      if (Math.hypot(this.player.x - term.x, this.player.y - term.y) < 30 && !term.hacked) {
        if (this.keys['KeyE']) {
          term.hackProgress += dt * 60;
          sound.playHackBeep();
          if (term.hackProgress >= 100) {
            term.hacked = true;
            this.spawnRadDrops(term.x, term.y, 4);
          }
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.distanceTravelled += Math.hypot(p.vx * dt, p.vy * dt);

      // Hit wall
      if (this.checkWallCollision(p.x, p.y, 3) || p.distanceTravelled > p.maxDistance) {
        this.createSparks(p.x, p.y, p.fromPlayer ? '#f6e05e' : '#e53e3e');
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
            this.createSparks(p.x, p.y, '#ffffff');
            this.screenShake = 3;
            if (g.health <= 0) {
              g.state = 'dead';
              this.spawnRadDrops(g.x, g.y, 2);
            }
            hit = true;
            break;
          }
        }

        if (!hit && currentRoom.boss && !currentRoom.boss.defeated) {
          const boss = currentRoom.boss;
          if (Math.hypot(p.x - boss.x, p.y - boss.y) < 24) {
            boss.health -= p.damage * 10;
            this.createSparks(p.x, p.y, '#ff2020');
            this.screenShake = 4;
            if (boss.health <= 0) {
              boss.defeated = true;
              this.spawnRadDrops(boss.x, boss.y, 8);
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

    // 5. Draw Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect(Math.floor(p.x) - 2, Math.floor(p.y) - 2, 5, 5);
      ctx.fillStyle = p.fromPlayer ? '#f6e05e' : '#ff2020';
      ctx.fillRect(Math.floor(p.x) - 1, Math.floor(p.y) - 1, 3, 3);
      ctx.restore();
    }

    // 6. Draw Dust / Sparks
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.floor(pt.x) - 1, Math.floor(pt.y) - 1, Math.floor(pt.size), Math.floor(pt.size));
      ctx.restore();
    }

    // 7. Draw Duck Mutant Protagonist
    const isMoving = (this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']);
    drawDuckPlayer(
      ctx,
      this.player.x,
      this.player.y,
      this.player.angle,
      this.player.walkCycle,
      !!isMoving,
      this.player.isSwinging,
      this.player.swingProgress
    );

    ctx.restore();

    // 8. Draw Nuclear Throne Crosshair at mouse cursor
    drawNuclearCrosshair(ctx, this.mousePos.x, this.mousePos.y);
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

    // Draw Items
    for (const item of room.items) {
      if (item.type === 'ammo' || item.type === 'explosives') {
        drawExplosivesChest(ctx, item.x, item.y);
      } else if (item.type === 'intel') {
        drawRadCanister(ctx, item.x, item.y);
      } else {
        drawPixelRect(ctx, item.x - 5, item.y - 5, 10, 10, item.type === 'medkit' ? '#ff2020' : '#48bb78');
      }
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
}
