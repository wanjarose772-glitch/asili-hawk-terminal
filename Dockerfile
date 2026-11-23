FROM node:22-alpine AS web-build
WORKDIR /src
COPY package.json package-lock.json* ./
RUN npm ci
COPY vite.config.ts tsconfig.json ./
COPY frontend ./frontend
RUN npm run build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/app ./backend/app
COPY frontend/dist ./frontend/dist
RUN mkdir -p /app/backend/data
WORKDIR /app/backend
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
