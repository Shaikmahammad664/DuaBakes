# DuaBakes Backend

This repository contains a FastAPI backend for the DuaBakes application.

## Setup

1. Create a Python environment and install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
2. Create the MySQL schema:
   - Start your MySQL server.
   - Run the SQL in `db_schema.sql`.
3. Copy `.env` and set your local database and Brevo email settings:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=duabakes
   SENDER_EMAIL=your_verified_sender@example.com
   BREVO_API_KEY=your_brevo_api_key
   SENDER_NAME=Bakes App
   FRONTEND_URL=http://localhost:5173
   ```
   - `SENDER_EMAIL` should be a verified sender in your Brevo account.
   - `BREVO_API_KEY` must be a Brevo transactional HTTP API key, not an SMTP key.
     - SMTP keys start with `xsmtpsib-` and will not work with `https://api.brevo.com/v3/smtp/email`.
   - `SENDER_NAME` is optional and appears as the email display name.
   - `FRONTEND_URL` should match the URL where the React app is served.


## Run locally

```bash
python main.py
```

The API will listen on `http://localhost:7788`.

## API endpoints

- `POST /signup` — register a new user
- `POST /login` — login using email and password
- `POST /forgot-password` — request a password reset link
- `POST /reset-password` — reset a user password
- `POST /admin/login` — admin login
- `POST /AddProducts` — admin add product (legacy route)
- `POST /products` — add a new product
- `GET /products` — list all products
- `GET /products/{product_id}` — retrieve product details

## Notes

- The backend now uses MySQL for users, admin, and products.
- The `api.js` front-end helper was updated so login works with the existing login page payload.
