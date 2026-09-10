# 01. Visión General del Dominio y Core Loop

## 1. Identidad y Dominio del Juego

**Agente 077: Rogue Espionage** es un videojuego de acción y sigilo táctico con perspectiva cenital (*top-down*), ambientado en un páramo desértico y complejos subterráneos corporativos de alta tecnología (*Wasteland Espionage*).

El diseño combina elementos de:
- **Roguelike / Roguelite Arcade:** Generación procedural de niveles por semillas, combate frenético de disparos continuos y progresión piso a piso.
- **Twin-Stick Keyboard Shooter:** Movimiento desacoplado del disparo (movimiento libre con WASD y disparo direccional con flechitas sin uso de ratón).
- **Infiltración Táctica:** Conos de visión enemiga, medidores de alerta, terminales de seguridad para sabotaje y sigilo mediante ruido reducido.

---

## 2. El Bucle Principal de Juego (Core Loop)

El flujo de juego sigue un ciclo iterativo estructurado:

```
                  ┌───────────────────────────────────┐
                  │          INICIO DE PISO           │
                  │   Generación Procedural (Seed)    │
                  │   Spawn en Sala de Entrada (START)│
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                  ┌───────────────────────────────────┐
                  │       EXPLORACIÓN Y COMBATE       │
                  │  • Movimiento táctico con WASD    │
                  │  • Disparo continuo con Flechitas │
                  │  • Neutralización de centinelas   │
                  │  • Hackeo de terminales [E]       │
                  │  • Recolección de Rads y Munición │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                  ┌───────────────────────────────────┐
                  │          SALA DEL JEFE            │
                  │  • Desactivar escudos del Boss    │
                  │  • Sobrevivir a barridos láser    │
                  │  • Bajas críticas y llave de piso │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                  ┌───────────────────────────────────┐
                  │       ELEVADOR DE EXTRACCIÓN      │
                  │   Interactuar [E] en el Ascensor  │
                  └─────────────────┬─────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        [DERROTA: HP = 0]                 [PISO COMPLETADO]
     • Pantalla de Game Over           • Pantalla de Victoria Parcial
     • Registro en Leaderboard         • Incremento de piso (1-N)
     • Retorno o Reinicio              • Guardado en Cloud Firestore
```

---

## 3. Condiciones de Victoria y Derrota

### Condición de Victoria por Piso
1. El jugador atraviesa el **Camino Crítico** (*Critical Path*) hasta alcanzar la sala designada como `BOSS`.
2. El Jefe del Piso es derrotado (su barra de vida y escudo caen a 0).
3. Se desbloquea el ascensor/elevador de extracción.
4. El jugador se posiciona sobre el ascensor y presiona la tecla de interacción `E`.
5. Se calculan las recompensas del piso, bonificaciones de Rads y se regenera el siguiente nivel (`floorLevel + 1`).

### Condición de Derrota (Game Over)
1. Los puntos de salud del jugador (`health`) caen a `0` tras recibir daño de balas enemigas, contacto cuerpo a cuerpo o trampas láser.
2. El motor activa el estado `isGameOver = true`.
3. Se detiene el loop de acción en el canvas.
4. Se recopilan las estadísticas de la sesión (piso alcanzado, Rads reunidos, bajas infligidas, tiempo total).
5. Se muestra el modal de Game Over permitiendo guardar la puntuación en la **Tabla de Clasificación Global** de Firebase.
