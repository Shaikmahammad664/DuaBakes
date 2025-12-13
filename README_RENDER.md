Deploying to Render (Docker)
-----------------------------

This repository contains a Dockerfile configured to run the FastAPI app using Uvicorn.

Usage notes for Render:

- Render will detect the Dockerfile and build the image.
- The service must expose a port. Render provides the port at runtime via the environment variable `PORT`.
- The Dockerfile uses `uvicorn main:app --host 0.0.0.0 --port ${PORT:-7788}` so it will use Render's `PORT` when present.

Environment variables to set in Render's dashboard (example):

- `MONGO_URL` — your MongoDB connection string
- `DB_NAME` — database name (e.g. DuaBakes)
- `USER_COLLECTION` — collection name for users
- `SENDER_EMAIL` — email address used to send password reset emails
- `EMAIL_PASSWORD` — password or app password for the sender email

Quick local test with Docker (PowerShell):

```powershell
# build the image
docker build -t bakes .

# run locally (map 7788 -> 7788 and set PORT env)
docker run -e PORT=7788 -p 7788:7788 --env-file .env bakes
```

If you want to pin exact Python packages, add a `requirements.txt` or update the Dockerfile to use your `pyproject.toml` with a specific installer (poetry, pip-tools, etc.).
