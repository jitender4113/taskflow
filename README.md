# 🚀 TaskFlow — Project Management App

TaskFlow is a full-stack project management application designed to help teams collaborate, organize tasks, and track progress efficiently. It includes role-based permissions, task boards, dashboards, and team management features — all in one place.

---

## ✨ Key Features

### 🔐 Authentication

* Secure signup and login using JWT
* Password hashing with bcrypt
* Persistent user sessions

### 📁 Project Management

* Create and manage multiple projects
* Assign custom colors for easy identification
* View project-specific details and members

### 👥 Role-Based Access Control

* **Admin**: Full control over project settings and members
* **Member**: Limited access based on permissions

### 🧩 Task Management

* Kanban-style board + list view
* Drag-and-drop-like status updates
* Add priority, assignee, due date, and comments

### 📊 Dashboard

* Overview of tasks and project progress
* Visual indicators for completion
* Alerts for overdue tasks

### 📌 My Tasks

* Centralized view of all assigned tasks
* Filter and sort across projects

### 🤝 Team Collaboration

* Invite users via email
* Update roles dynamically
* Remove members when needed

---

## 🛠 Tech Stack

**Frontend**

* React 18
* React Router v6
* Vite

**Backend**

* Node.js
* Express.js
* JWT Authentication
* bcryptjs

**Database**

* SQLite (via sql.js, file-based persistence)

---

## 🚀 Deployment (Railway)

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### 2. Deploy on Railway

* Go to Railway dashboard
* Create a new project → Deploy from GitHub
* Select your repository
* Auto-build will start

### 3. Configure Environment Variables

Add the following in Railway → Variables:

```
NODE_ENV=production
JWT_SECRET=your_secret_key_here
PORT=3000
```

### 4. Access Your App

After deployment, Railway provides a live URL:

```
https://your-app-name.up.railway.app
```

---

## 💻 Local Development

### Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run Backend

```bash
cd backend
JWT_SECRET=devsecret node server.js
```

Backend runs at: http://localhost:3001

### Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── middleware.js
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       └── tasks.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── utils/
│   └── vite.config.js
├── railway.toml
├── nixpacks.toml
└── package.json
```

---

## 🔌 API Overview

### Auth

* `POST /api/auth/signup` → Register user
* `POST /api/auth/login` → Login
* `GET /api/auth/me` → Get logged-in user

### Projects

* `GET /api/projects` → List projects
* `POST /api/projects` → Create project
* `GET /api/projects/:id` → Project details
* `PUT /api/projects/:id` → Update project (Admin)
* `DELETE /api/projects/:id` → Delete project (Owner)

### Team

* `POST /api/projects/:id/members` → Add member
* `PUT /api/projects/:id/members/:userId` → Update role
* `DELETE /api/projects/:id/members/:userId` → Remove member

### Tasks

* `GET /api/tasks/dashboard` → Dashboard stats
* `GET /api/tasks/my` → My tasks
* `GET /api/tasks/project/:id` → Tasks by project
* `POST /api/tasks` → Create task
* `PUT /api/tasks/:id` → Update task
* `DELETE /api/tasks/:id` → Delete task
* `GET /api/tasks/:id` → Task details
* `POST /api/tasks/:id/comments` → Add comment

---

## 🧠 About This Project

This project was built to practice full-stack development concepts including authentication, REST APIs, database design, and modern React architecture. It demonstrates how a real-world collaboration tool can be structured and implemented.

---

## 📌 Future Improvements

* Real drag-and-drop (DnD library)
* Notifications system
* File attachments in tasks
* Dark mode UI
* WebSocket-based real-time updates

---

## 📄 License

This project is open-source and free to use for learning and development purposes.

---

