# Documentación de Lógica de Negocio - Agente 077: Rogue Espionage

Bienvenido a la documentación técnica y de lógica de negocio de **Agente 077: Rogue Espionage**. Esta carpeta reúne las especificaciones, reglas de juego, fórmulas matemáticas, flujos de datos y arquitectura del sistema.

---

## 📑 Índice de Documentación

1. [01. Visión General del Dominio y Core Loop](./01_vision_general_y_core_loop.md)
   - Propósito del juego, género y pilares de diseño.
   - Diagrama del bucle principal de juego (*Core Gameplay Loop*).
   - Condiciones de victoria, derrota y transición de pisos.

2. [02. Mecánicas de Jugador y Combate](./02_mecanicas_jugador_y_combate.md)
   - Controles desacoplados: Movimiento WASD 8-direcciones y Disparo continuo con Flechitas.
   - Físicas, normalización vectorial y cálculo de retroceso.
   - Sistema de armas, proyectiles, casquillos, chispas y munición.
   - Esquive táctico (*Dash*), sigilo, katana/deflexión y estados temporales.

3. [03. Generación Procedural de Mazmorras](./03_generacion_procedural.md)
   - Semillas aleatorias reproducibles (*Seeded RNG* - LCG).
   - Estructura de cuadrícula (Grid 5x5) y tipos de salas (Start, Patrol, Server Hub, Armory, Boss, etc.).
   - Algoritmo de *Critical Path* garantizado y pasillos transitables sin callejones rotos.
   - Población de entidades: prefabs, enemigos, cofres, terminales y rads.

4. [04. Inteligencia Artificial y Entidades Hostiles](./04_inteligencia_artificial_enemigos.md)
   - Arquetipos de enemigos: Bandidos, Escorpiones, Francotiradores y Tropas Pesadas.
   - Máquina de estados finitos (*FSM*): `idle`, `patrol`, `suspicious`, `alert`, `dead`.
   - Conos de visión (FOV), líneas de visión (Raycasting top-down) y propagación de ruido.
   - Comportamiento del Jefe de Piso: fases, escudo, ráfagas y barrido láser.

5. [05. Sistemas Secundarios: Terminales, Rads y Audio](./05_sistemas_secundarios.md)
   - Terminales interactivos y tipos de hackeo (reseteo de alarmas, revelado de mapa, bypass).
   - Economía de la partida: Rads, botines de salud, recarga de munición y explosivos.
   - Motor de audio sintético procedural (Web Audio API) sin dependencias de ficheros externos.

6. [06. Arquitectura de Datos y Firebase](./06_arquitectura_datos_firebase.md)
   - Modelo de datos en Google Cloud Firestore: `users`, `leaderboard`, `game_saves`.
   - Políticas y reglas de seguridad (`firestore.rules`).
   - Flujo de sincronización de perfiles, mejores puntuaciones y guardado de partida.

---

*Documentación generada para Agente 077 - Rogue Espionage.*
