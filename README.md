### 🌍 Live Demo

👉 [leave-system-lilac.vercel.app](https://leave-system-lilac.vercel.app)

````markdown
#  Leave Management System  

A modern **Leave Management System** built with **React + Vite** (frontend) and **Node.js + PostgreSQL** (backend).  
It allows employees to apply for leave, managers to review, and HR/admins to track leave records seamlessly.

---

## ✨ Features  

- 📅 **Calendar Overview** – View leave records with month navigation and color-coded status.  
- 👨‍💼 **Employee Management** – Register new employees, manage profiles & reset passwords.  
- 📝 **Leave Applications** – Apply, edit, and delete leave requests.  
- 🔔 **Notifications Panel** – Animated sidebar with real-time updates.  
- 🔐 **Authentication** – JWT-based secure login system.  
- 🎨 **Modern UI** – Glassmorphism-inspired design with SF Pro / Inter fonts.  
- ⚡ **Fast Deployment** – Optimized with Vite and deployable on Vercel.  

---

## 🛠️ Tech Stack  

**Frontend**  
- React + Vite  
- TailwindCSS  
- classnames  
- React Router  

**Backend**  
- Node.js (Express)  
- PostgreSQL (via pgAdmin / Supabase)  
- JWT Authentication  

**Deployment**  
- Vercel (Frontend)  
- Railway / Render / Supabase (Backend + DB)  

---

## 🚀 Getting Started  

### 1. Clone the repo  
```bash
git clone https://github.com/<your-username>/leave-system.git
cd leave-system
````

### 2. Install dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in **backend/**

```env
PORT=5000
DATABASE_URL=postgres://admin:yourpassword@localhost:5432/database_name
JWT_SECRET=super_long_random_secret_12345
```

### 4. Run locally

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm start
```

---

## 📸 Screenshots

### Dashboard

![Dashboard](./frontend/src/assets/Dashboard.png)

### Login Screen

![login-screen](./frontend/src/assets/login-screen.png)

### Calendar Overview

![Calendar-overview](./frontend/src/assets/Calendar-overview.png)

---

## 🔮 Upcoming Improvements

* ✅ Better error handling for **Change Password**
* ✅ Smooth animations for sidebar interactions
* ✅ Loading indicators for **Save Profile / Change Password**
* ✅ Full CRUD support for "My Leaves"

---

## 🤝 Contributing

Pull requests are welcome!
If you find a bug or want a new feature, open an **issue**.

---

## 📜 License

This project is licensed under the **MIT License**.

---


