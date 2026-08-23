# Hoopjot — Codex Handoff Pack

Este paquete contiene la documentación de producto, arquitectura y ejecución para desarrollar **Hoopjot**, una PWA mobile-first para ayudar a jugadores y jugadoras de baloncesto a mejorar mediante focos diarios, reflexión y seguimiento de progreso.

## Cómo usar este paquete

1. Crea un repositorio Git vacío para Hoopjot.
2. Copia **todo el contenido de este paquete en la raíz del repositorio**.
3. Haz el primer commit solo con documentación y assets.
4. Abre Codex en ese repositorio.
5. Ejecuta los prompts de `prompts/CODEX_PROMPTS.md` **en orden**.
6. No le pidas a Codex que implemente varias fases de golpe.
7. Después de cada fase:
   - revisa el diff;
   - abre la preview de Vercel cuando exista;
   - prueba en móvil;
   - confirma lint, typecheck y tests;
   - corrige antes de avanzar.

## Regla de oro

La documentación persistente vive en el repositorio. Los prompts solo indican **qué spec ejecutar ahora**.

Codex debe leer `AGENTS.md` antes de trabajar y la spec correspondiente antes de escribir código.

## Stack decidido

- React + TypeScript + Vite
- React Router
- Tailwind CSS
- Zod
- Dexie / IndexedDB
- Supabase Auth + PostgreSQL + RLS + Storage + Edge Functions
- TanStack Query solo para estado remoto cuando sea necesario
- vite-plugin-pwa / Workbox
- Vitest + React Testing Library + Playwright
- pnpm
- Vercel

## Decisiones de producto cerradas

- Nombre: **Hoopjot**
- Idiomas iniciales: **English + Spanish**
- Preparado para N idiomas
- Público: neutral en género
- Edad mínima: 16
- Registro por email desde el inicio
- Offline-first
- IA fuera del MVP inicial
- Vídeo fuera del MVP inicial
- Contenido basket desarrollado como base editorial independiente

## Orden recomendado

Consulta `docs/ROADMAP.md` y `prompts/CODEX_PROMPTS.md`.

No avances a una spec posterior mientras la anterior no cumpla sus criterios de aceptación.
