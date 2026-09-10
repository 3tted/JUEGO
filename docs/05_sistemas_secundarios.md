# 05. Sistemas Secundarios: Terminales, Rads y Audio

## 1. Terminales de Pirateo e Interacción

Distribuidas por las salas tecnológicas (`SERVER_HUB`, `CCTV_ROOM`), existen terminales de red que el jugador puede hackear presionando la tecla de interacción `E`.

### Tipos de Terminales y Efectos
1. **`alarm_reset` (Reinicio de Alarma):**
   - Reduce inmediatamente a cero el nivel de alerta global de la sala.
   - Devuelve a los enemigos cercanos de estado `alert` a `patrol`.
2. **`map_reveal` (Reconocimiento Táctico):**
   - Revela en el mapa táctico (`M` o `Tab`) la disposición de todas las habitaciones del piso, la ubicación de cofres y la sala del jefe.
3. **`disable_cameras` (Bypass de Seguridad):**
   - Apaga temporalmente todas las cámaras de seguridad y barreras láser intermitentes durante 25 segundos.
4. **`boss_override` (Sobrecarga de Servidores):**
   - Desactiva el escudo del jefe o reduce su cadencia de disparo durante la batalla final.

> **Regla de Ejecución Obligatoria:** Cada terminal tiene asignado un protocolo criptográfico inmutable (`circuit_maze`, `frequency_lock`, `memory_cipher` o `wire_bypass`). No se permiten cambios de minijuego ni atajos de bypass automático; el agente debe resolver obligatoriamente el minijuego correspondiente para desbloquear la terminal y reclamar los Rads de bonificación.

---

## 2. Economía de la Partida: Rads y Suministros

Durante la incursión, el jugador puede obtener diferentes tipos de recursos arrojados por enemigos o cofres:

| Ítem | Tipo | Efecto |
| :--- | :--- | :--- |
| **Rads (`rad`)** | Moneda / Puntuación | Otorga puntos para la clasificación global y sube el rango del agente. |
| **Munición (`ammo`)** | Suministro | Recarga la reserva de munición convencional para el arma principal. |
| **Explosivos (`explosives`)** | Munición especial | Provee cargas explosivas de área. |
| **Botiquín (`medkit`)** | Salud | Restaura $25$ puntos de salud (`health`) hasta el máximo permitido. |
| **Intel (`intel`)** | Coleccionable | Archivos clasificados que otorgan multiplicadores de bonificación final. |

---

## 3. Motor de Audio Sintético Procedural (Web Audio API)

Para evitar la descarga de archivos `.wav` o `.mp3` pesados y asegurar tiempos de carga instantáneos, todo el diseño sonoro del juego se genera por síntesis modular en tiempo real utilizando la **Web Audio API** del navegador (`src/game/audio.ts`):

- **Disparo de Arma:** Generado mediante un oscilador de frecuencia rápida con onda en diente de sierra (*sawtooth*), modulado con un filtro pasabajos envolvente rápido y ruido blanco (*white noise*) para emular el estallido balístico.
- **Impactos y Chispas:** Generados con pulsos de ruido con decaimiento exponencial ultra-corto ($0.05\text{ s}$).
- **Katana / Swoosh:** Generado con un oscilador de onda senoidal (*sine wave*) con caída de frecuencia en rampa pronunciada.
- **Alarma de Detección:** Generador de tono bifrecuencia oscilante ($880\text{ Hz} \leftrightarrow 440\text{ Hz}$) que se activa cuando un enemigo entra en estado `alert`.
- **Explosión:** Ruido con filtrado paso banda profundo y saturación suave (*soft clipping*).
