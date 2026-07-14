# DuaBakes - React Frontend

This is the React frontend for the DuaBakes bakery e-commerce application, built with Vite and integrated with a FastAPI backend.

## Project Structure

```
src/
├── components/        # Reusable React components
│   ├── Navbar.jsx    # Navigation bar with search
│   ├── Hero.jsx      # Hero section
│   ├── Categories.jsx # Category cards carousel
│   └── Chatbot.jsx   # AI chatbot component
├── pages/            # Page components
│   ├── Home.jsx      # Home page
│   ├── Login.jsx     # Login page
│   └── Signup.jsx    # Signup page
├── services/         # API service layer
│   └── api.js        # Axios instance and API calls
├── styles/           # Component and page styles
│   ├── Navbar.css
│   ├── Categories.css
│   ├── Hero.css
│   ├── Auth.css
│   ├── Chatbot.css
│   └── Home.css
├── App.jsx          # Main app component with routing
├── App.css          # Global styles
├── main.jsx         # Entry point
└── index.css        # Global CSS
```

## Setup & Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### 1. Install Dependencies

```bash
cd c:\Users\Windows\ 11\OneDrive\Desktop\bakes
npm install
```

### 2. Configure Backend URL

The app is configured to call the backend at `http://localhost:7788`. If your backend runs on a different port, update the URL in:
- `src/services/api.js` - Change `API_BASE_URL`
- `vite.config.js` - Update proxy configuration if needed

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally

## API Integration

### Authentication
- `POST /signup` - Register new user
- `POST /login` - Login user
- `POST /admin-login` - Admin login

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get single product
- `GET /products/category/:category` - Get products by category

### Chat
- `POST /chat` - Send message to AI chatbot

All API calls are handled through `src/services/api.js` using Axios.

## Backend Integration

The frontend connects to the FastAPI backend. Make sure your Python backend is running:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

The backend should be running on `http://localhost:7788`

## Features

- ✅ User authentication (Signup/Login)
- ✅ Product browsing by categories
- ✅ Responsive design for mobile and desktop
- ✅ AI chatbot assistant
- ✅ Search functionality
- ✅ Cart management
- ✅ User account management

## Technologies Used

- **React 18** - UI library
- **Vite** - Fast build tool
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with responsive design

## Troubleshooting

### 1. CORS Errors
If you see CORS errors, make sure your FastAPI backend has CORS middleware enabled:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Backend Connection Issues
- Check that FastAPI is running on port 7788
- Verify the API_BASE_URL in `src/services/api.js`

### 3. Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port.

## File Storage

Make sure your `assets` folder contains all image files:
- `bakes logo.png`
- `cartlogo.png`
- `accounticon.png`
- `ai logo1.png`
- Category images (cake.png, cupcake.png, etc.)

## Next Steps

1. Implement cart functionality
2. Add order management pages
3. Implement payment integration
4. Add user profile/account pages
5. Implement admin dashboard

## Support

For issues or questions, refer to the backend documentation or contact the development team.
