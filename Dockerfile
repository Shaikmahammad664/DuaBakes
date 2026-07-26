FROM python:3.14-slim AS build
WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7788
CMD ["sh", "-lc", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7788}"]

