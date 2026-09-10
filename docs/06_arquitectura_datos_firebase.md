# 06. Arquitectura de Datos y Firebase

## 1. Integración con Google Cloud Firestore

La persistencia de datos en la nube está estructurada bajo tres colecciones principales en Firestore:

```
firestore-root
  │
  ├── /users/{userId}               --> Perfil persistente del agente
  │     ├── id: string
  │     ├── displayName: string
  │     ├── email: string
  │     ├── faction: string
  │     ├── highestFloor: number
  │     ├── totalRads: number
  │     ├── runsPlayed: number
  │     └── updatedAt: timestamp
  │
  ├── /leaderboard/{entryId}        --> Puntuaciones históricas de partidas
  │     ├── id: string
  │     ├── userId: string
  │     ├── displayName: string
  │     ├── floorLevel: number
  │     ├── radsCollected: number
  │     ├── outcome: "victory" | "defeated"
  │     └── createdAt: timestamp
  │
  └── /game_saves/{userId}          --> Estado de partida guardada para reanudar
        ├── userId: string
        ├── floorLevel: number
        ├── seed: number
        ├── playerX: number
        ├── playerY: number
        ├── currentRoomId: string
        ├── health: number
        ├── ammo: number
        └── updatedAt: timestamp
```

---

## 2. Reglas de Seguridad (`firestore.rules`)

Las reglas aplican el principio de mínimo privilegio y control de acceso basado en roles/identidad (*RBAC / Owner Isolation*):

1. **Colección `/users/{userId}`:**
   - **Lectura:** Pública para usuarios autenticados (para consultar perfiles y facciones de otros agentes en la tabla de clasificación).
   - **Escritura/Modificación:** Exclusiva del propio usuario (`request.auth.uid == userId`). Se valida que no se modifique el campo `id` original y que los campos numéricos como `highestFloor` sean positivos.
2. **Colección `/leaderboard/{entryId}`:**
   - **Lectura:** Pública para que cualquier jugador pueda visualizar el Top Global.
   - **Creación:** Exclusiva para usuarios autenticados donde `request.resource.data.userId == request.auth.uid`. Se validan tipos y rangos de datos (ej. `floorLevel >= 1`).
   - **Modificación/Eliminación:** Bloqueada para prevenir manipulación retroactiva de puntuaciones.
3. **Colección `/game_saves/{userId}`:**
   - **Lectura y Escritura:** Estrictamente privada para el dueño de la partida (`request.auth.uid == userId`).

---

## 3. Autenticación de Jugadores

El sistema de autenticación soporta dos modalidades gestionadas en `src/firebase/service.ts`:
1. **Inicio de Sesión con Correo y Contraseña:** Permite conservar el progreso permanente, nombre de agente personalizado y facción.
2. **Sesión de Agente Anónima (Invitado):** Permite jugar instantáneamente sin registro previo y competir en la tabla de clasificación local/global durante la sesión activa.
