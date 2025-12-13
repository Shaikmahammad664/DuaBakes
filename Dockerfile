
FROM python:3.11-slim

# set working directory
WORKDIR /app

# install minimal build tools (some packages may need compilation)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential gcc \
	&& rm -rf /var/lib/apt/lists/*

# copy project
COPY . .

# install Python dependencies required to run the app
# (explicit list so build doesn't depend on an external requirements file)
RUN pip install --no-cache-dir fastapi uvicorn pymongo python-dotenv loguru dnspython

ENV PYTHONUNBUFFERED=1

# Render sets a PORT env var. Default to 7788 for local runs.
EXPOSE 7788

# Use shell form so ${PORT} is expanded at runtime by the shell
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7788}"]

