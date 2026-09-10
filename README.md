# Agente 077 - Rogue Espionage 🕵️‍♂️💥

**Agente 077 - Rogue Espionage** es un juego de acción y espionaje roguelike con vista cenital (top-down) y estética pixel art inspirada en clásicos del género como *Nuclear Throne* y *Enter the Gungeon*.

Cuenta con generación procedimental de mazmorras con pasillos transitables garantizados, combate arcade de doble eje (movimiento desacoplado del disparo), terminales de pirateo, efectos de partículas, síntesis de audio procedimental y tabla de clasificación global en línea con Firebase.

---

## 🎮 Controles del Juego

El juego utiliza un esquema de control arcade 100% de teclado (sin necesidad de ratón):

| Acción | Teclas | Descripción |
| :--- | :--- | :--- |
| **Movimiento (8 direcciones)** | `W`, `A`, `S`, `D` | Desplazamiento con vector normalizado (sin aceleración diagonal). |
| **Disparo continuo** | `↑`, `↓`, `←`, `→` (Flechitas) | Apunta y dispara proyectiles automáticamente con cadencia (`fireRate`). |
| **Esquive táctico (Dash)** | `Barra Espaciadora` | Evasión rápida con tiempo de enfriamiento (cooldown). |
| **Recarga táctica** | `R` | Recarga el cargador del arma con la reserva de munición. |
| **Interacción** | `E` | Hackeo de terminales, cofres y paso de ascensor/nivel. |
| **Mapa / Blueprint táctico** | `M` o `Tab` | Alterna la visualización del mapa de la planta. |
| **Menú de Controles / Ayuda** | `H` | Muestra el panel informativo de controles. |
| **Pausa / Menú** | `Escape` | Cierra modales y ventanas emergentes activas. |

> ⚡ **Acciones Simultáneas:** Puedes moverte en cualquier dirección con **WASD** mientras mantienes presionadas las **flechitas** para disparar ráfagas en una dirección completamente distinta.

---

## ✨ Características Principales

- **Motor Canvas 2D de Alto Rendimiento:**
  - Renderizado por sprites pixel art con soporte de rotación, balanceo y partículas (casquillos de bala, chispas, sangre, explosiones).
  - Efectos visuales de retroceso y sacudida de pantalla (*screen shake*).
  - Retícula táctica direccional acoplada al vector de apuntado.

- **Generación Procedural de Niveles:**
  - Creación de habitaciones temáticas (almacén, laboratorio, sala de servidores, sala de control).
  - Conexión garantizada entre salas mediante corredores excavados por autómatas celulares y algoritmos de grafos.
  - Línea de meta con ascensor de evacuación hacia el siguiente piso.

- **Inteligencia Artificial y Enemigos:**
  - Múltiples arquetipos: Centinelas con armas de fuego, patrullas pesadas, guardias rápidos y torretas fijas.
  - Conos de visión con alerta escalonada (sospecha $\rightarrow$ detección $\rightarrow$ combate).

- **Minijuego de Hacking en Terminales:**
  - Terminales de seguridad interactivos (`Tecla E`) con desafíos de desencriptación para obtener ventajas y créditos.

- **Audio Procedural (Web Audio API):**
  - Efectos de sonido generados en tiempo real (disparos silenciados, ráfagas, recargas, alarmas de detección, explosiones y deslizadas de katana) sin depender de archivos de audio pesados.

- **Tabla de Clasificación Global (Firebase Firestore & Auth):**
  - Registro e inicio de sesión de agentes (correo/contraseña o anónimo).
  - Puntuaciones sincronizadas en la nube: pisos completados, bajas, créditos acumulados y tiempo de supervivencia.

---

## 🛠️ Stack Tecnológico

- **Frontend & UI:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía e Interfaz:** [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Motor de Juego:** HTML5 2D Canvas puro (`src/game/engine.ts`) con bucle `requestAnimationFrame`
- **Persistencia & Backend:** [Firebase Firestore](https://firebase.google.com/docs/firestore) y [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Herramientas de Construcción:** [Vite](https://vitejs.dev/)

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos

- **Node.js** (versión 18 o superior recomendada)
- **npm**, **pnpm** o **bun**

### Pasos

1. **Clonar o descargar el proyecto:**
   ```bash
   git clone <url-del-repositorio>
   cd agente-077-rogue-espionage
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en [http://localhost:3000](http://localhost:3000).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

5. **Verificar tipos y lint:**
   ```bash
   npm run lint
   ```

---

## 📂 Estructura del Proyecto

```text
├── docs/                        # Documentación completa de lógica de negocio
│   ├── README.md                # Índice general de la documentación
│   ├── 01_vision_general_y_core_loop.md
│   ├── 02_mecanicas_jugador_y_combate.md
│   ├── 03_generacion_procedural.md
│   ├── 04_inteligencia_artificial_enemigos.md
│   ├── 05_sistemas_secundarios.md
│   └── 06_arquitectura_datos_firebase.md
├── src/
│   ├── components/              # Componentes de React para la interfaz de usuario
│   │   ├── HUD.tsx              # Barra superior con salud, munición, piso y estado
│   │   ├── LeaderboardModal.tsx # Clasificación global y autenticación de agentes
│   │   ├── Modals.tsx           # Modales de Game Over, Piso Completado e Instrucciones
│   │   ├── TerminalMinigameModal.tsx # Minijuego interactivo de descifrado
│   │   └── VirtualControls.tsx  # Soporte de controles en pantalla
│   ├── firebase/                # Conexión, autenticación y persistencia Firestore
│   │   ├── FirebaseContext.tsx  # Proveedor de contexto React para Auth y Firestore
│   │   ├── config.ts            # Inicialización de la app Firebase
│   │   └── service.ts           # Servicios de lectura/escritura de perfiles y ranking
│   ├── game/                    # Motor central del juego en Canvas 2D
│   │   ├── engine.ts            # Lógica principal, bucle de juego, físicas y render
│   │   ├── generator.ts         # Generador procedimental de mazmorras y camino crítico
│   │   ├── prefabs.ts           # Plantillas matriciales de salas y constantes
│   │   ├── pixelSprites.ts      # Sprites matriciales y dibujado pixel art
│   │   └── audio.ts             # Sintetizador de audio procedural (Web Audio API)
│   ├── App.tsx                  # Componente raíz y orquestador del canvas
│   ├── types.ts                 # Tipos TypeScript compartidos del dominio
│   └── main.tsx                 # Punto de entrada de React
├── public/                      # Recursos estáticos
├── firestore.rules              # Reglas de seguridad para Firestore
├── firebase-blueprint.json      # Esquema de datos de Firestore
└── package.json                 # Dependencias y scripts
```

---

## 📄 Licencia

Este proyecto está desarrollado como demostración técnica de videojuego web roguelike en Google AI Studio.
