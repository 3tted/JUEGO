# 03. Generación Procedural de Mazmorras

## 1. Semillas Deterministas (Seeded RNG)

Toda la planta de la mazmorra se genera a partir de una semilla numérica (`seed`), utilizando un Generador de Congruencia Lineal (*Linear Congruential Generator - LCG*):

$$X_{n+1} = (a \cdot X_n + c) \pmod m$$
Donde:
- $m = 2^{31} = 2147483648$
- $a = 1103515245$
- $c = 12345$

Esto garantiza que la misma semilla genere exactamente la misma distribución de habitaciones, puertas, cofres, enemigos y pasillos transitables en cualquier máquina.

---

## 2. Cuadrícula y Topología de Habitaciones

- **Matriz Global:** La mazmorra se organiza en una cuadrícula virtual de **5x5** celdas (`GRID_SIZE = 5`).
- **Dimensiones por Habitación:**
  - Ancho: 15 tiles.
  - Alto: 11 tiles.
  - Tamaño de cada Tile: $48 \times 48\text{ px}$.
  - Ancho total de sala en píxeles: $720\text{ px}$.
  - Alto total de sala en píxeles: $528\text{ px}$.

### Tipos de Salas Disponibles
1. **`START`:** Sala de inserción del jugador; libre de enemigos inmediatos.
2. **`PATROL`:** Sala con rutas de patrulla definidas para guardias centinela.
3. **`LASER_GRID`:** Sala con emisores de barreras láser oscilantes intermitentes.
4. **`SERVER_HUB`:** Sala tecnológica con racks de datos y terminales pirateables.
5. **`ARMORY`:** Sala de suministros con munición pesada y botiquines.
6. **`CCTV_ROOM`:** Sala con cámaras de vigilancia rotatorias de amplio ángulo.
7. **`LABORATORY`:** Sala experimental con obstáculos, químicos y especímenes hostiles.
8. **`BOSS`:** Sala final de gran escala que contiene al Jefe del piso y el ascensor de extracción.

---

## 3. Algoritmo del Camino Crítico (Critical Path)

Para evitar niveles insolubles o laberintos bloqueados por paredes sólidas:

1. **Selección de Origen y Fin:** Se ubica la sala de inicio (`START`) y se calcula la celda más distante mediante distancia Manhattan para alojar la sala `BOSS`.
2. **Excavación de Camino Crítico:** Se traza una ruta de celdas contiguas conectando `START` con `BOSS`.
3. **Generación de Puertas Opuestas:** Cuando dos habitaciones adyacentes comparten frontera, se crean automáticamente puertas recíprocas:
   - Puerta Norte en $(x, y) \iff$ Puerta Sur en $(x, y-1)$.
   - Puerta Este en $(x, y) \iff$ Puerta Oeste en $(x+1, y)$.
4. **Waypoints de Conexión Física:** Se calcula una lista de puntos de paso físicos garantizados (`detailedPathWaypoints`) que unen las baldosas de suelo libres desde el spawn hasta la puerta del ascensor, asegurando que no existan muros o escombros ocluyendo el paso del jugador.

---

## 4. Matriz de Tiles y Capas de Prefabs

Cada sala se instancia a partir de una plantilla matricial predefinida (`PREFABS`), donde cada carácter representa un tipo de baldosa:
- `.` : Suelo transitable (`floor`).
- `#` : Muro impenetrable (`wall`).
- `D` : Puerta de paso (`door`).
- `E` : Ascensor / elevador de salida (`elevator`).
- `C` : Cobertura / obstáculo de visión (`cover`).
- `T` : Terminal interactivo (`terminal`).
- `X` : Caja o contenedor de botín (`crate`).
- `*` : Peligro o trampa de superficie (`hazard`).
