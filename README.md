# TaskFlow — Team Task Manager

A full-stack web app where users can create projects, assign tasks, and track progress with role-based access (Admin/Member).

## Tech Stack

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Vite
- **Auth**: JWT (JSON Web Tokens)
- **Deployment**: Railway

## Features

- ✅ Authentication (Signup / Login with JWT)
- ✅ Role-Based Access Control (Admin / Member)
- ✅ Project & team management
- ✅ Task creation, assignment & status tracking (Kanban: Todo → In Progress → Done)
- ✅ Dashboard with metrics (total, in-progress, completed, overdue)
- ✅ Overdue task detection
- ✅ Priority levels (High / Medium / Low)

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install

```bash
git clone <your-repo-url>
cd taskflow
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Set up database

```bash
cd backend
npm run migrate   # creates tables
npm run seed      # loads demo data
```

### 4. Run development servers

In two terminals:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

**Demo accounts:**
- Admin: `admin@demo.com` / `password`
- Member: `member@demo.com` / `password`

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### 3. Add PostgreSQL

1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Railway auto-sets `DATABASE_URL` in your environment

### 4. Set environment variables

In Railway → your service → **Variables**, add:

```
JWT_SECRET=<generate a strong random string>
NODE_ENV=production
```

### 5. Run migrations on Railway

In Railway → your service → **Shell**:

```bash
cd backend && node db/migrate.js && node db/seed.js
```

### 6. Deploy

Railway auto-deploys on every push to `main`. Your app will be live at `https://<your-service>.railway.app`.

## API Endpoints

### Auth
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Auth | Current user |
| GET | `/api/auth/users` | Admin | List all users |
| PATCH | `/api/auth/users/:id/role` | Admin | Change user role |

### Projects
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/projects` | Auth | List projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Member | Get project |
| PATCH | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |

### Tasks
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/tasks` | Auth | All visible tasks |
| GET | `/api/tasks/my` | Auth | My tasks |
| GET | `/api/tasks/project/:id` | Member | Tasks by project |
| GET | `/api/tasks/dashboard` | Auth | Stats summary |
| POST | `/api/tasks` | Member | Create task |
| PATCH | `/api/tasks/:id` | Member | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

## Project Structure

```
taskflow/
├── backend/
│   ├── db/
│   │   ├── index.js        # DB connection pool
│   │   ├── migrate.js      # Schema creation
│   │   └── seed.js         # Demo data
│   ├── middleware/
│   │   └── auth.js         # JWT + role middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Modal
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Dashboard, Projects, MyTasks, Team
│   │   ├── api.js          # Axios instance
│   │   ├── utils.js        # Helpers
│   │   ├── App.jsx         # Router
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── railway.toml
└── README.md
```
