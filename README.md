# CUHP Devs

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Turbo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-Workspace-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

CUHP Devs is a coding practice and student developer community platform organized as a Turbo + pnpm monorepo. It combines a Next.js frontend, an Express API, a Socket.IO realtime service, MongoDB-backed shared data models, and a local problem pipeline for coding challenges with generated multi-language boilerplate.

The repository is no longer a generic Turborepo starter. It already contains implemented flows for authentication, onboarding/profile setup, dashboard views, problem practice, realtime chat rooms, community posts/snippets, resources, settings, and public developer profiles.

## Overview

> [!NOTE]
> A student developer platform that combines coding practice, public profiles, community interaction, realtime chat, and curated learning resources in one monorepo.

## Architecture

```text
apps/
  web/             Next.js frontend
  http-backend/    Express REST API
  socket/          Socket.IO realtime service
  problems/        Local problem statements, testcases, and generated boilerplate
packages/
  ui/                    Shared UI components
  db/                    Shared Mongoose models, schemas, and DB scripts
  common/                Shared common package
  boilerplate-generator/ Problem boilerplate generation package
  eslint-config/         Shared lint config
  typescript-config/     Shared tsconfig presets
```

### Apps

#### Web App
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?style=flat-square&logo=nextdotjs&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State-7B3FE4?style=flat-square)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO-Client-010101?style=flat-square&logo=socketdotio&logoColor=white)

- Built with Next.js App Router and React 19.
- Uses server components and client components together.
- Fetches backend data through shared API helpers.
- Uses Zustand for auth, onboarding, theme, sidebar, and toast state.
- Uses Framer Motion for animated transitions and richer UI behavior.
- Uses `socket.io-client` for realtime community chat features.

#### HTTP Backend
![Express](https://img.shields.io/badge/Express-API-000000?style=flat-square&logo=express&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-Validation-3068B7?style=flat-square&logo=zod&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Cookies-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

- Built with Express + TypeScript.
- Exposes REST endpoints for auth, users, problems, submissions, code execution, languages, and posts.
- Uses JWT in cookies for auth.
- Uses Zod for request validation in the auth flow.
- Starts a background result worker after MongoDB connection is ready.

#### Socket Service
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Change_Streams-47A248?style=flat-square&logo=mongodb&logoColor=white)

- Separate realtime service using Socket.IO.
- Authenticates sockets before connection.
- Handles chat room join/leave flows, member presence, room stats, typing events, message send/delete, and room creation.
- Watches Mongo post inserts with change streams and broadcasts new posts when supported by MongoDB.

#### Problems Catalog
![Boilerplate](https://img.shields.io/badge/Boilerplate-Generated-2563EB?style=flat-square)
![Testcases](https://img.shields.io/badge/Testcases-Local-059669?style=flat-square)

- Stores coding challenge assets locally.
- Each problem can contain `Problem.md`, `Structure.md`, testcase input/output files, and generated language boilerplates.
- Example problem folders in the repo show the expected structure for challenge authoring.

### Shared Packages

#### `packages/ui`
- Shared UI library used by the web app.
- Contains reusable section UIs for dashboard, practice, community, auth, navigation, settings, and profile overview.
- Includes Monaco editor integration and markdown rendering utilities.

#### `packages/db`
- Shared Mongoose connection, models, schemas, interfaces, and enums.
- Includes scripts for syncing problems, updating problem data, and seeding testcases into MongoDB.

#### `packages/boilerplate-generator`
- Parses a problem `Structure.md` file.
- Generates starter boilerplate and full executable wrappers for C++, Rust, Python, and JavaScript.
- Supports generation for one problem slug or for all problems in the local catalog.

## Tech Stack

### Frontend
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Monaco-Editor-007ACC?style=flat-square)
![React Markdown](https://img.shields.io/badge/Markdown-Rendering-111827?style=flat-square&logo=markdown&logoColor=white)

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- Zustand
- Monaco Editor via `@monaco-editor/react`
- `react-markdown` + `remark-gfm`
- `socket.io-client`
- `lucide-react` and `react-icons`

### Backend and Realtime
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-Auth-334155?style=flat-square)
![Piston](https://img.shields.io/badge/Piston-Code_Execution-7C3AED?style=flat-square)

- Express 5
- Socket.IO
- MongoDB + Mongoose
- JWT + cookie-based auth
- bcrypt
- Zod
- Axios
- Piston-based code execution
- `p-limit` for bounded concurrent testcase execution

### Tooling
![pnpm](https://img.shields.io/badge/pnpm-Workspace-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Turbo](https://img.shields.io/badge/Turbo-Build_System-EF4444?style=flat-square&logo=turborepo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)

- pnpm workspaces
- Turborepo
- TypeScript
- ESLint
- Prettier


Deployment requirements, environment examples, and verification commands are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Known Gaps and Current Problems

> [!WARNING]
> Some sections are fully wired, while others still rely on mocked payloads, staged UI, or infrastructure assumptions such as MongoDB replica-set support for change streams.

This README should reflect the code honestly, so these limitations are worth calling out:

- The current `README.md` previously lagged behind the actual product and still looked like a starter repo.
- Some dashboard, community, and resources content is still mocked or partially hardcoded.
- Practice category filtering is not fully backed by resolved tag metadata yet.
- Practice submissions are judged asynchronously on the server; the page polls until a final verdict is available.
- Submission transactions and live post broadcasts require MongoDB configured as a replica set (for example, Atlas).
- A few UI sections are clearly scaffolded for future growth, especially side widgets and some resources/settings capabilities.

## Scripts

![Install](https://img.shields.io/badge/Run-pnpm_install-059669?style=flat-square)
![Build](https://img.shields.io/badge/Run-pnpm_build-059669?style=flat-square)
![Dev](https://img.shields.io/badge/Run-pnpm_dev-2563EB?style=flat-square)
![Lint](https://img.shields.io/badge/Run-pnpm_lint-D97706?style=flat-square)
![Types](https://img.shields.io/badge/Run-pnpm_check--types-7C3AED?style=flat-square)

From the repository root:

```bash
pnpm install
pnpm build
pnpm dev
pnpm lint
pnpm check-types
```

Problem and DB utility scripts:

```bash
pnpm generate-boilerplate
pnpm problem-update:db
pnpm problems-sync:db
pnpm testcases-push:db
```

## Local Services

| Service | Default Port |
| --- | --- |
| Web app | `http://localhost:3000` |
| HTTP backend | `http://localhost:3001` |
| Socket server | `http://localhost:4001` |

## Development Notes

- The workspace uses `pnpm` and `turbo` from the repo root.
- The backend and socket apps depend on the shared `@repo/db` package.
- The web app expects the backend and socket services to be available for full functionality.
- The project includes local problem assets and scripts, so the coding platform is not just UI-only; it already includes challenge content, default code generation, and execution plumbing.
