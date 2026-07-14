# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

This will install:
- React 18
- Vite (build tool)
- React Router (routing)
- Axios (HTTP client)

### Step 2: Start Backend (Python)
Open a NEW terminal and run your Python FastAPI backend:
```bash
# Make sure you're in the bakes directory
python main.py
```

Your backend should be running on `http://localhost:7788`

### Step 3: Start React Development Server
In your original terminal, run:
```bash
npm run dev
```

Your React app will be available at `http://localhost:5173`

---

## ✅ You're All Set!

Your app is now running with:
- **Frontend**: React on http://localhost:5173
- **Backend**: FastAPI on http://localhost:7788
- **Database**: Connected through FastAPI

## 📝 Project Structure Summary

```
bakes/
├── src/                    # React source code
│   ├── components/         # Reusable components
│   ├── pages/              # Page components (Home, Login, Signup)
│   ├── services/           # API communication (api.js)
│   ├── styles/             # CSS files
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── index.html              # HTML template
├── main.py                 # FastAPI backend
├── db_ops.py               # Database operations
└── requirements.txt        # Python dependencies
```

## 🔧 Useful Commands

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `python main.py` | Start FastAPI backend |

## 🎨 What's Included

✨ **Frontend (React)**
- Navigation bar with search
- Product categories carousel
- Hero section
- Login & Signup pages
- AI Chatbot
- Mobile responsive design

⚙️ **Backend (FastAPI)**
- User authentication
- Product management
- Order system
- Database integration
- AI chatbot

## 🐛 Common Issues

**Q: CORS Error?**
A: Make sure FastAPI has CORS enabled. Check main.py.

**Q: Can't connect to backend?**
A: Verify FastAPI is running on port 7788.

**Q: Port already in use?**
A: Vite will auto-select next available port.

---

**You're ready to start developing! Happy coding! 🎉**
