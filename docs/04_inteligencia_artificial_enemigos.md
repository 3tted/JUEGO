# 04. Inteligencia Artificial y Entidades Hostiles

## 1. Arquetipos de Enemigos

El juego cuenta con cuatro tipos de enemigos con diferentes perfiles de combate y movimiento:

| Arquetipo | Salud (`maxHealth`) | Velocidad (`speed`) | Rango FOV | Comportamiento |
| :--- | :--- | :--- | :--- | :--- |
| **Bandido (`bandit`)** | Media ($12-18$) | Rápida ($90\text{ px/s}$) | $220\text{ px}$ | Patrulla en bucle y dispara ráfagas estándar de pistola. |
| **Escorpión (`scorpion`)** | Baja ($8-12$) | Muy alta ($120\text{ px/s}$) | $180\text{ px}$ | Embestida rápida hacia el jugador en distancias cortas. |
| **Francotirador (`sniper`)**| Muy baja ($6-10$) | Lenta ($60\text{ px/s}$) | $380\text{ px}$ | Gran alcance de visión; proyectiles de alta velocidad. |
| **Pesado (`heavy`)** | Alta ($30-45$) | Pesada ($50\text{ px/s}$) | $240\text{ px}$ | Dispara proyectiles múltiples con dispersión tipo escopeta. |

---

## 2. Máquina de Estados Finitos (FSM)

Los enemigos operan bajo una máquina de estados con cinco fases:

```
                  ┌──────────────┐
                  │    IDLE      │
                  └──────┬───────┘
                         │ (temporizador)
                         ▼
                  ┌──────────────┐
       ┌─────────►│   PATROL     │◄────────┐
       │          └──────┬───────┘         │
       │                 │                 │
       │ (pierde rastro) │ (ruido o cono)  │ (calma)
       │                 ▼                 │
       │          ┌──────────────┐         │
       └──────────┤  SUSPICIOUS  ├─────────┘
                  └──────┬───────┘
                         │ (alerta 100%)
                         ▼
                  ┌──────────────┐
                  │    ALERT     │ ───► [DISPARO Y PERSECUCIÓN]
                  └──────┬───────┘
                         │ (salud <= 0)
                         ▼
                  ┌──────────────┐
                  │    DEAD      │ ───► [SPAWN DE BOTÍN Y RADS]
                  └──────────────┘
```

### Transiciones de Estado
1. **`idle` $\rightarrow$ `patrol`:** Tras permanecer quieto durante un intervalo aleatorio, el guardia se desplaza hacia el siguiente nodo de su ruta predefinida (`patrolPoints`).
2. **`patrol` $\rightarrow$ `suspicious`:** Si el jugador emite ruido dentro del radio auditivo o ingresa tangencialmente al cono de visión, el medidor de alerta (`alertMeter`) comienza a subir y el guardia orienta su ángulo hacia la fuente del sonido.
3. **`suspicious` $\rightarrow$ `alert`:** Cuando el medidor de alerta alcanza el 100%, el enemigo entra en modo de combate hostil, alertando a otros enemigos cercanos por radiofrecuencia y persiguiendo activamente al jugador.
4. **`alert` $\rightarrow$ `dead`:** Al recibir impactos continuos de balas o daño de proyectiles reflejados hasta agotar sus puntos de vida. Al morir, expulsa partículas de sangre, chispas y genera botines de munición o Rads.

---

## 3. Cono de Visión (FOV) y Oclusión Visual

Cada centinela y cámara de seguridad calcula su visión en tiempo real:
- **Ángulo de apertura:** $70^\circ$ ($\approx 1.22\text{ radianes}$).
- **Distancia máxima:** Varía entre $180\text{ px}$ y $380\text{ px}$ según el arquetipo.
- **Oclusión:** Si una pared sólida (`wall`) o elemento de cobertura (`cover`) interseca el segmento que une los ojos del enemigo con el centro del jugador, la línea de visión se interrumpe y el jugador permanece invisible en las sombras.

---

## 4. El Jefe de Piso (Boss Entity)

El Jefe representa el desafío culminante de cada nivel. Cuenta con dos fases de combate:

### Fase 1: Escudo Energético y Ráfagas
- Posee un escudo protector regenerativo (`shield`). Mientras el escudo esté activo, el daño directo a la vida se reduce en un 80%.
- Dispara salvas de proyectiles en abanico ($360^\circ$) con intervalos regulares.

### Fase 2: Barrido Láser y Furia
- Al reducir su escudo y el 50% de su vida, activa su estado de furia.
- Incrementa su velocidad de movimiento y desata un barrido láser giratorio de alto daño que obliga al jugador a sincronizar el esquive táctico (`Dash`).
- Al ser derrotado, desbloquea la terminal del ascensor y arroja una gran cantidad de Rads y suministros.
