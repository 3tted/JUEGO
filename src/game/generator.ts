import {
  Direction,
  DungeonFloor,
  Point,
  RoomDoor,
  RoomInstance,
  RoomType,
  Tile,
} from '../types';
import {
  CENTER_TILE,
  DOOR_E,
  DOOR_N,
  DOOR_S,
  DOOR_W,
  PREFABS,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  TILE_SIZE,
} from './prefabs';

const GRID_SIZE = 5;

// Helper to get opposite direction
export function getOppositeDir(dir: Direction): Direction {
  switch (dir) {
    case 'N':
      return 'S';
    case 'S':
      return 'N';
    case 'E':
      return 'W';
    case 'W':
      return 'E';
  }
}

// Direction offsets in grid coords
const DIR_OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  S: { dx: 0, dy: 1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
};

export class SeededRNG {
  private m = 0x80000000;
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  nextFloat(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(min + this.nextFloat() * (max - min + 1));
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

export function generateDungeon(seed: number, floorLevel: number = 1): DungeonFloor {
  const rng = new SeededRNG(seed);
  const targetRoomCount = rng.nextInt(8, 12);

  // Initialize room grid (5x5)
  const roomGrid: (string | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

  // Start at bottom or center-bottom (e.g. 2, 4)
  const startGx = 2;
  const startGy = 4;
  const startId = 'room_start';

  const placedCoords: { gx: number; gy: number; id: string; depth: number }[] = [];
  roomGrid[startGy][startGx] = startId;
  placedCoords.push({ gx: startGx, gy: startGy, id: startId, depth: 0 });

  // Frontier queue to grow dungeon rooms
  const queue: { gx: number; gy: number; depth: number }[] = [{ gx: startGx, gy: startGy, depth: 0 }];

  let roomCounter = 1;

  while (queue.length > 0 && placedCoords.length < targetRoomCount) {
    // Pick from queue with slight bias to branch
    const idx = rng.nextInt(0, queue.length - 1);
    const current = queue[idx];

    const dirs: Direction[] = rng.shuffle(['N', 'S', 'E', 'W']);
    let expanded = false;

    for (const dir of dirs) {
      const nx = current.gx + DIR_OFFSETS[dir].dx;
      const ny = current.gy + DIR_OFFSETS[dir].dy;

      // Check bounds
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        if (!roomGrid[ny][nx]) {
          // Count neighbor rooms to prevent over-clustering
          let neighborCount = 0;
          for (const d of ['N', 'S', 'E', 'W'] as Direction[]) {
            const adjX = nx + DIR_OFFSETS[d].dx;
            const adjY = ny + DIR_OFFSETS[d].dy;
            if (adjX >= 0 && adjX < GRID_SIZE && adjY >= 0 && adjY < GRID_SIZE && roomGrid[adjY][adjX]) {
              neighborCount++;
            }
          }

          // Allow placement if reasonable connectivity
          if (neighborCount <= 2 || (placedCoords.length < 5 && neighborCount <= 3)) {
            const newId = `room_${roomCounter++}`;
            roomGrid[ny][nx] = newId;
            const newDepth = current.depth + 1;
            placedCoords.push({ gx: nx, gy: ny, id: newId, depth: newDepth });
            queue.push({ gx: nx, gy: ny, depth: newDepth });
            expanded = true;
            if (placedCoords.length >= targetRoomCount) break;
          }
        }
      }
    }

    if (!expanded) {
      queue.splice(idx, 1);
    }
  }

  // Identify the room with the greatest topological distance (depth) from start as the BOSS room
  let maxDepth = -1;
  let bossCandidate = placedCoords[1];

  for (const node of placedCoords) {
    if (node.id === startId) continue;
    if (node.depth > maxDepth) {
      maxDepth = node.depth;
      bossCandidate = node;
    }
  }

  const bossRoomId = bossCandidate ? bossCandidate.id : placedCoords[placedCoords.length - 1].id;

  // Pool of regular room types
  const regularTypes: RoomType[] = [
    'PATROL',
    'LASER_GRID',
    'SERVER_HUB',
    'ARMORY',
    'CCTV_ROOM',
    'LABORATORY',
  ];

  // Assign room types
  const roomTypes = new Map<string, RoomType>();
  roomTypes.set(startId, 'START');
  roomTypes.set(bossRoomId, 'BOSS');

  // Ensure at least one Armory and one Server Hub are present for tactical gameplay
  const otherCoords = placedCoords.filter((c) => c.id !== startId && c.id !== bossRoomId);
  const shuffledOthers = rng.shuffle(otherCoords);

  if (shuffledOthers.length > 0) roomTypes.set(shuffledOthers[0].id, 'ARMORY');
  if (shuffledOthers.length > 1) roomTypes.set(shuffledOthers[1].id, 'SERVER_HUB');
  if (shuffledOthers.length > 2) roomTypes.set(shuffledOthers[2].id, 'LASER_GRID');

  for (let i = 3; i < shuffledOthers.length; i++) {
    roomTypes.set(shuffledOthers[i].id, rng.choice(regularTypes));
  }

  // Create RoomInstances
  const rooms = new Map<string, RoomInstance>();

  // Determine doors between adjacent rooms
  for (const node of placedCoords) {
    const rType = roomTypes.get(node.id) || 'PATROL';
    const templates = PREFABS[rType] || PREFABS.PATROL;
    const template = rng.choice(templates);

    // World bounds for this room
    const worldX = node.gx * ROOM_WIDTH * TILE_SIZE;
    const worldY = node.gy * ROOM_HEIGHT * TILE_SIZE;

    // Check adjacent doors
    const doors: Partial<Record<Direction, RoomDoor>> = {};
    for (const dir of ['N', 'S', 'E', 'W'] as Direction[]) {
      const adjX = node.gx + DIR_OFFSETS[dir].dx;
      const adjY = node.gy + DIR_OFFSETS[dir].dy;
      if (adjX >= 0 && adjX < GRID_SIZE && adjY >= 0 && adjY < GRID_SIZE) {
        const neighborId = roomGrid[adjY][adjX];
        if (neighborId) {
          // Both rooms have an open door connecting them
          doors[dir] = {
            dir,
            targetRoomId: neighborId,
            isOpen: true,
            isLocked: node.id === bossRoomId || neighborId === bossRoomId ? false : false,
          };
        }
      }
    }

    // Build tile matrix from template layout
    const tiles: Tile[][] = [];
    for (let ty = 0; ty < ROOM_HEIGHT; ty++) {
      const row: Tile[] = [];
      for (let tx = 0; tx < ROOM_WIDTH; tx++) {
        let char = template.layout[ty]?.[tx] || '.';
        let type: Tile['type'] = 'floor';
        let subType: Tile['subType'] = undefined;
        let walkable = true;
        let seeThrough = true;

        if (char === '#') {
          type = 'wall';
          walkable = false;
          seeThrough = false;
        } else if (char === 'c') {
          type = 'cover';
          subType = 'crate';
          walkable = false;
          seeThrough = true; // can see over cover
        } else if (char === 't') {
          type = 'floor';
          subType = 'terminal';
          walkable = true;
          seeThrough = true;
        } else if (char === 'e') {
          type = 'elevator';
          walkable = true;
          seeThrough = true;
        }

        // CARVE DOORS: if this tile matches a door slot and the door is active
        if (tx === DOOR_N.x && ty === DOOR_N.y && doors.N) {
          type = 'door';
          walkable = true;
          seeThrough = true;
        } else if (tx === DOOR_S.x && ty === DOOR_S.y && doors.S) {
          type = 'door';
          walkable = true;
          seeThrough = true;
        } else if (tx === DOOR_W.x && ty === DOOR_W.y && doors.W) {
          type = 'door';
          walkable = true;
          seeThrough = true;
        } else if (tx === DOOR_E.x && ty === DOOR_E.y && doors.E) {
          type = 'door';
          walkable = true;
          seeThrough = true;
        }

        // Randomly place props in open desert areas (safe from blocking doors)
        const isDoorCorridor = tx === DOOR_N.x || ty === DOOR_W.y;
        if (type === 'floor' && !isDoorCorridor && tx > 1 && tx < ROOM_WIDTH - 2 && ty > 1 && ty < ROOM_HEIGHT - 2) {
          const propRand = rng.nextFloat();
          if (propRand < 0.04) {
            type = 'cactus';
            walkable = false;
          } else if (propRand < 0.08) {
            type = 'barrel_cactus';
            walkable = false;
          } else if (propRand < 0.11) {
            type = 'carcass';
            walkable = false;
          }
        }

        row.push({
          x: tx,
          y: ty,
          type,
          subType,
          walkable,
          seeThrough,
        });
      }
      tiles.push(row);
    }

    // GUARANTEE INTERNAL PATHWAY:
    // Ensure that straight corridors from any active door to the room center are strictly walkable!
    if (doors.N) {
      for (let y = 0; y <= CENTER_TILE.y; y++) {
        tiles[y][CENTER_TILE.x].walkable = true;
        if (tiles[y][CENTER_TILE.x].type === 'cover') tiles[y][CENTER_TILE.x].type = 'floor';
      }
    }
    if (doors.S) {
      for (let y = CENTER_TILE.y; y < ROOM_HEIGHT; y++) {
        tiles[y][CENTER_TILE.x].walkable = true;
        if (tiles[y][CENTER_TILE.x].type === 'cover') tiles[y][CENTER_TILE.x].type = 'floor';
      }
    }
    if (doors.W) {
      for (let x = 0; x <= CENTER_TILE.x; x++) {
        tiles[CENTER_TILE.y][x].walkable = true;
        if (tiles[CENTER_TILE.y][x].type === 'cover') tiles[CENTER_TILE.y][x].type = 'floor';
      }
    }
    if (doors.E) {
      for (let x = CENTER_TILE.x; x < ROOM_WIDTH; x++) {
        tiles[CENTER_TILE.y][x].walkable = true;
        if (tiles[CENTER_TILE.y][x].type === 'cover') tiles[CENTER_TILE.y][x].type = 'floor';
      }
    }

    // Instantiate entities
    const guards = template.spawnGuards ? template.spawnGuards(worldX, worldY) : [];
    const cameras = template.spawnCameras ? template.spawnCameras(worldX, worldY) : [];
    const lasers = template.spawnLasers ? template.spawnLasers(worldX, worldY) : [];
    const terminals = template.spawnTerminals ? template.spawnTerminals(worldX, worldY) : [];
    const items = template.spawnItems ? template.spawnItems(worldX, worldY) : [];
    const boss = template.spawnBoss ? template.spawnBoss(worldX, worldY) : undefined;

    const instance: RoomInstance = {
      id: node.id,
      gridX: node.gx,
      gridY: node.gy,
      type: rType,
      name: template.name,
      description: template.description,
      doors,
      tiles,
      guards,
      cameras,
      lasers,
      terminals,
      items,
      boss,
      isCleared: rType === 'START',
      isVisited: node.id === startId,
      hasBeenRevealed: node.id === startId,
      isLockedDown: false,
      doorAnimProgress: 0,
      bounds: {
        worldX,
        worldY,
        width: ROOM_WIDTH * TILE_SIZE,
        height: ROOM_HEIGHT * TILE_SIZE,
      },
    };

    rooms.set(node.id, instance);
  }

  // CALCULATE CRITICAL PATH & GUARANTEE TRANSITABLE TRAIL:
  // Step 1: Topological BFS on rooms
  const roomPath = findRoomPath(startId, bossRoomId, rooms);

  // Step 2: Tile-by-tile A* / BFS pathfinding between Start Room center and Boss Room center
  const detailedWaypoints = calculateDetailedTransitablePath(startId, bossRoomId, roomPath, rooms);

  // Calculate stats
  let totalGuards = 0;
  let totalTerminals = 0;
  rooms.forEach((r) => {
    totalGuards += r.guards.length;
    totalTerminals += r.terminals.length;
  });

  const floorNames = [
    'Perímetro de Infiltración y Seguridad Alfa',
    'Complejo Subterráneo de Servidores e I+D',
    'Búnker Blindado de Alta Seguridad - Núcleo',
  ];

  return {
    seed,
    floorLevel,
    name: floorNames[(floorLevel - 1) % floorNames.length] || `Sector de Espionaje ${floorLevel}`,
    gridWidth: GRID_SIZE,
    gridHeight: GRID_SIZE,
    rooms,
    startRoomId: startId,
    bossRoomId,
    roomGrid,
    criticalPath: roomPath,
    detailedPathWaypoints: detailedWaypoints,
    totalGuards,
    totalTerminals,
  };
}

// Room-level BFS
function findRoomPath(startId: string, endId: string, rooms: Map<string, RoomInstance>): string[] {
  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1];

    if (currentId === endId) {
      return path;
    }

    const currentRoom = rooms.get(currentId);
    if (!currentRoom) continue;

    for (const door of Object.values(currentRoom.doors)) {
      if (door && door.targetRoomId && !visited.has(door.targetRoomId)) {
        visited.add(door.targetRoomId);
        queue.push([...path, door.targetRoomId]);
      }
    }
  }

  return [startId, endId];
}

// Tile-level guaranteed transitable path builder
function calculateDetailedTransitablePath(
  startId: string,
  bossId: string,
  roomPath: string[],
  rooms: Map<string, RoomInstance>
): Point[] {
  const waypoints: Point[] = [];

  for (let i = 0; i < roomPath.length; i++) {
    const currentRoom = rooms.get(roomPath[i]);
    if (!currentRoom) continue;

    // Room center in world coordinates
    const centerWorldX = currentRoom.bounds.worldX + CENTER_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const centerWorldY = currentRoom.bounds.worldY + CENTER_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    if (i === 0) {
      // Start at player spawn
      waypoints.push({ x: centerWorldX, y: centerWorldY });
    }

    // Connect to next room through common door
    if (i < roomPath.length - 1) {
      const nextRoom = rooms.get(roomPath[i + 1]);
      if (nextRoom) {
        // Find direction to next room
        const dx = nextRoom.gridX - currentRoom.gridX;
        const dy = nextRoom.gridY - currentRoom.gridY;

        let doorTile = CENTER_TILE;
        if (dy === -1) doorTile = DOOR_N;
        else if (dy === 1) doorTile = DOOR_S;
        else if (dx === -1) doorTile = DOOR_W;
        else if (dx === 1) doorTile = DOOR_E;

        const doorWorldX = currentRoom.bounds.worldX + doorTile.x * TILE_SIZE + TILE_SIZE / 2;
        const doorWorldY = currentRoom.bounds.worldY + doorTile.y * TILE_SIZE + TILE_SIZE / 2;

        // Path: current center -> this door -> next room center
        waypoints.push({ x: centerWorldX, y: centerWorldY });
        waypoints.push({ x: doorWorldX, y: doorWorldY });
      }
    } else {
      // End at boss room center (or elevator)
      waypoints.push({ x: centerWorldX, y: centerWorldY });
    }
  }

  // Deduplicate consecutive identical waypoints
  const cleaned: Point[] = [];
  for (let i = 0; i < waypoints.length; i++) {
    if (i === 0) cleaned.push(waypoints[i]);
    else {
      const prev = cleaned[cleaned.length - 1];
      const curr = waypoints[i];
      if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 5) {
        cleaned.push(curr);
      }
    }
  }

  return cleaned;
}
