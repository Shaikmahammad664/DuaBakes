# DuaBakes Project Overview

## Project Description
DuaBakes is a web application for a bakery business, featuring user authentication, product management, and an AI-powered chatbot for customer inquiries. The application consists of a FastAPI backend serving a frontend built with HTML, CSS, and JavaScript.

## Technologies Used

### Backend
- **FastAPI**: A modern, fast web framework for building APIs with Python 3.7+ based on standard Python type hints. Used for creating RESTful API endpoints for user management, authentication, product operations, and chatbot integration.
- **Python**: The primary programming language for the backend logic.
- **MySQL**: Relational database management system used to store user data, admin credentials, and product information.
- **Uvicorn**: ASGI web server implementation for Python, used to run the FastAPI application.
- **OpenAI API**: Integrated via OpenRouter for the chatbot functionality, allowing AI-powered responses to bakery-related queries.
- **SMTP**: Used for sending password reset emails.

### Frontend
- **HTML**: Markup language for structuring the web pages (signup, login, products, admin login, etc.).
- **CSS**: Styling language for designing the visual appearance of the web pages.
- **JavaScript**: Programming language for client-side interactivity, including form handling and API calls.
- **jQuery**: JavaScript library used for DOM manipulation and AJAX requests.

### Database
- **MySQL**: The database system with tables for:
  - `users`: Stores customer information (name, email, password, phone).
  - `Admin`: Stores administrator credentials.
  - `products`: Stores bakery product details (name, description, category, price, stock, etc.).

### Development and Deployment
- **Docker**: Containerization platform for packaging the application and its dependencies.
- **python-dotenv**: Library for loading environment variables from a `.env` file.
- **Loguru**: Logging library for better log management in Python.
- **pip**: Package installer for Python dependencies.

### Key Features
- User registration and login
- Password reset functionality via email
- Admin login and product management
- Product catalog with details
- AI chatbot for bakery-related customer support
- Responsive web interface

### Architecture
- **Monolithic Application**: The backend serves both API endpoints and potentially static files.
- **RESTful API**: Endpoints for CRUD operations on users and products.
- **CORS Enabled**: Allows cross-origin requests, likely for serving the frontend from the same server.
- **Environment Configuration**: Uses `.env` file for sensitive data like database credentials and API keys.

### File Structure Overview
- `main.py`: Main FastAPI application entry point.
- `db_ops.py`: Database operations functions.
- `chat_bot.py`: Chatbot logic using OpenAI.
- `db_schema.sql`: MySQL database schema.
- `api.js`: Frontend JavaScript for API interactions.
- Various HTML/CSS files: Frontend pages and styles.
- `requirements.txt` / `pyproject.toml`: Python dependencies.
- `Dockerfile`: Container configuration.

This project demonstrates a full-stack web application with modern Python backend technologies, integrated AI features, and containerized deployment capabilities.