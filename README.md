# TechMart AI — Tech E-Commerce Platform

Premium AI-assisted technology e-commerce platform with Mongolian & English support.

## Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Zustand + React Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 + Redis
- **AI**: Anthropic Claude API (bilingual MN/EN)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15
- Redis
- Anthropic API key

### 1. Database
```bash
createdb techmart
psql techmart < server/migrations/001_initial_schema.sql
psql techmart < server/migrations/002_seed.sql
```

### 2. Server
```bash
cd server
cp .env.example .env
# Fill in .env values
npm install
npm run dev
```

### 3. Client
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Client: http://localhost:5173  
Server: http://localhost:4000  
Admin: http://localhost:5173/admin

### Default Admin
Email: `admin@techmart.mn`  
Password: `Admin1234!`

## Project Structure
```
techmart/
├── server/          Node.js + Express API
│   ├── src/
│   │   ├── config/       DB, Redis, env config
│   │   ├── middleware/   Auth, error, validation
│   │   ├── modules/      Feature modules (auth, products, ai, ...)
│   │   └── shared/       DB helper, errors, logger
│   └── migrations/   SQL migrations + seed
└── client/          React SPA
    └── src/
        ├── api/          Typed API client
        ├── components/   UI + product + layout components
        ├── hooks/        React Query hooks
        ├── pages/        All pages + admin panel
        ├── store/        Zustand stores
        └── types/        TypeScript types
```
