# 🐌 AI Slug Navigator

> **The smartest way for UC Santa Cruz students to build their class schedule.**

![Status](https://img.shields.io/badge/Status-Live-emerald?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## 💡 Inspiration
Signing up for classes at UCSC is stressful. Students have to juggle the **Course Catalog**, **MyUCSC**, and **RateMyProfessors** in three different tabs.  
**AI Slug Navigator** solves this by combining everything into one dashboard. It uses **Google Gemini AI** to act as a personal academic advisor, helping students find classes, check prerequisites, and build a conflict free schedule in seconds.

---

## 🚀 Key Features

* **🤖 AI Academic Advisor:** Chat with "Sammy AI" (powered by Gemini 2.5) to find classes based on your interests (for example, "Find me an easy GE for Arts credit").
* **📅 Smart Schedule Builder:** Drag and drop classes. The app automatically blocks time conflicts and calculates unit totals.
* **⭐ RMP Integration:** See RateMyProfessors ratings and difficulty scores directly on the course card.
* **⚡ Real Time Search:** Instant search across thousands of courses with best match sorting.
* **🔒 Privacy First:** Uses Google OAuth (Supabase) for secure login. We never sell student data.

---

## 📸 Screenshots

| **Smart Search & Filters** | **AI Schedule Builder** |
|:---:|:---:|
| <img src="./screenshots/search-view.png" width="400" alt="Search and Filters" /> | <img src="./screenshots/schedule-view.png" width="400" alt="Schedule with AI Chat" /> |

---

## 🛠️ Tech Stack

### Frontend
* **React + Vite**
* **Tailwind CSS**
* **Lucide React** (icons)

### Backend
* **Node.js + Express**
* **Google Gemini 2.5 Flash** (chat assistant)
* **Cheerio** (UCSC catalog scraper)

### Database and Auth
* **Supabase** (PostgreSQL + Google OAuth)
* **Prisma ORM**

---

## 💻 How to Run Locally

### 1. Clone the Repo
```bash
git clone https://github.com/jack-dao/ai-course-navigator.git
cd ai-course-navigator
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file with your keys:
# DATABASE_URL="your_supabase_url"
# GEMINI_API_KEY="your_google_key"
# PORT=3000

node server.js
```

### 3. Frontend Setup
```bash
# Open a new terminal window
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start building your schedule! 🐌

---

## ⚖️ Disclaimer
This project is a student built tool and is not affiliated with the University of California, Santa Cruz. Course data is scraped from public listings and may not reflect real time changes in MyUCSC.

## 🤝 Contributing
Found a bug? Open an issue or submit a pull request!
