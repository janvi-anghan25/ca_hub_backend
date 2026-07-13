# CA Office Management System

A full-featured MERN stack application for managing CA office workflows.

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, Zod, Multer, PDFKit, node-cron, Winston  
**Frontend:** React 18, Vite, Redux Toolkit, React Router v6, Tailwind CSS, Recharts, React Hook Form, Zod

## Features

- **Client Management** — Full CRUD with search, filters, tags, categories, photo upload
- **GST Return Management** — GSTR-1, 3B, 9, 9C, CMP-08, late fee tracking, monthly dashboard
- **ITR Management** — All ITR forms, refund tracking, assessment year management
- **Invoice & Payment** — Professional invoice generation, GST calculation, payment recording
- **Task Management** — Assign tasks to employees, priority/status tracking, comments
- **Employee Management** — Staff management, client assignment, attendance, leave
- **Document Storage** — Upload PDFs/images, version history, categorized storage
- **WhatsApp Reminders** — Auto GST/ITR payment reminders
- **Dashboard** — Revenue charts, pending items, today's tasks
- **Reports** — Revenue, GST, ITR, payment reports with charts
- **Notifications** — Real-time office notifications
- **Security** — JWT auth, role-based access, rate limiting, input validation, helmet

## Project Structure

```
CA Management/
├── backend/
│   └── src/
│       ├── config/        # DB config
│       ├── models/        # Mongoose models
│       ├── repositories/  # Data access layer
│       ├── services/      # Business logic
│       ├── controllers/   # Request handlers
│       ├── routes/        # API routes
│       ├── middleware/    # Auth, error, upload, validate
│       ├── validators/    # Zod schemas
│       ├── utils/         # Helpers
│       └── jobs/          # Cron schedulers
└── frontend/
    └── src/
        ├── api/           # Axios API layer
        ├── components/    # Shared components
        ├── pages/         # Feature pages
        ├── store/         # Redux store
        └── hooks/         # Custom hooks
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your config
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | `/api/v1/auth` |
| Clients | `/api/v1/clients` |
| GST Returns | `/api/v1/gst-returns` |
| ITR Returns | `/api/v1/itr-returns` |
| Invoices | `/api/v1/invoices` |
| Tasks | `/api/v1/tasks` |
| Documents | `/api/v1/documents` |
| Employees | `/api/v1/employees` |
| Dashboard | `/api/v1/dashboard` |
| Notifications | `/api/v1/notifications` |

## Architecture

Follows strict layered architecture:  
**Routes → Controllers → Services → Repositories → Models**

- No DB logic in controllers
- No business logic in routes
- All inputs validated with Zod
- Centralized error handling
- Structured logging with Winston
