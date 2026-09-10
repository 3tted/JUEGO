# 02. Mecánicas de Jugador y Combate

## 1. Esquema de Control Desacoplado (Sin Ratón)

El juego utiliza un sistema donde el desplazamiento espacial y el vector de ataque operan de manera totalmente independiente:

```
      MOVIMIENTO (Mano Izquierda)                  DISPARO (Mano Derecha)
               [ W ]                                        [ ↑ ]
          [ A ][ S ][ D ]                              [ ← ][ ↓ ][ → ]
  • 8 Direcciones espaciales                    • 8 Direcciones balísticas
  • Normalización estricta                      • Disparo automático continuo
  • Control físico de colisiones                • Cadencia por temporizador (fireRate)
```

### Normalización de Movimiento en Diagonales
Para evitar que moverse en diagonal (p. ej. `W + D`) otorgue una ventaja de velocidad ($\sqrt{1^2 + 1^2} \approx 1.414$), el motor normaliza matemáticamente el vector de velocidad:

$$\vec{v} = (v_x, v_y)$$
$$|\vec{v}| = \sqrt{v_x^2 + v_y^2}$$
$$\text{si } |\vec{v}| > 0 \implies v_{x,\text{norm}} = \frac{v_x}{|\vec{v}|}, \quad v_{y,\text{norm}} = \frac{v_y}{|\vec{v}|}$$

---

## 2. Sistema de Disparo y Balística

### Cadencia de Fuego (`fireRate`)
- La variable pública `fireRate` define el intervalo mínimo entre disparos automáticos continuos (por defecto `0.20` segundos $\rightarrow$ 5 proyectiles por segundo).
- Si el jugador mantiene presionada una o dos flechas direccionales, el temporizador interno `shootCooldownTimer` descuenta `dt` hasta llegar a 0, instanciando una bala y restableciéndose a `fireRate`.

### Parámetros del Proyectil del Jugador
- **Velocidad de Bala:** $720\text{ px/s}$.
- **Dispersión balística (*Spread*):** $(\text{rand}() - 0.5) \times 0.04\text{ rad}$.
- **Daño base:** $3.5$ puntos de salud por impacto.
- **Rango máximo:** $650\text{ px}$ de trayectoria antes de disiparse.
- **Efectos físicos:**
  - Eyección de casquillo metálico rotacional (`casings`).
  - Chispas de fogueo en la boca del cañón (`createSparks`).
  - Sacudida de pantalla (*screen shake*) con valor mínimo garantizado de $3\text{ px}$.

### Deflexión Balística
Al disparar, se evalúa un radio de corte frontal defensivo ($36\text{ px}$). Si hay proyectiles enemigos que van a impactar al jugador en esa zona, se invierte su vector y propiedad a `fromPlayer = true`, convirtiendo el ataque enemigo en un contraataque reflejado.

---

## 3. Maniobras Tácticas

### Esquive / Desplazamiento Rápido (*Dash*)
- **Activación:** Tecla `Espacio`.
- **Comportamiento:** Acelera drásticamente al jugador durante una ventana de frames breve, permitiendo rebasar ráfagas enemigas o atravesar zonas de fuego cruzado.
- **Enfriamiento (*Cooldown*):** Impide el spam continuo de la habilidad.

### Recarga de Cargador
- **Activación:** Manual con la tecla `R`, o automática al vaciar el cargador (`magAmmo === 0`).
- **Lógica de Munición:**
  - `magAmmo`: Balas disponibles en el cargador actual.
  - `magCapacity`: Capacidad máxima del cargador.
  - `ammo`: Reserva total disponible.
  - Durante la recarga (`isReloading = true`), una barra de progreso visualiza el tiempo hasta que la reserva transfiere munición al cargador.

### Retícula Táctica Direccional
Dado que no se utiliza el cursor del ratón, el motor proyecta una retícula nuclear táctica flotante a una distancia fija de $42\text{ px}$ frente al vector de orientación del personaje:

$$\text{aimX} = x_{\text{player}} + \cos(\theta) \times 42$$
$$\text{aimY} = y_{\text{player}} + \sin(\theta) \times 42$$
Donde $\theta$ representa el ángulo de disparo actual dictado por las flechas (o la dirección del paso si no se está disparando).
