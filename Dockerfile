# ── Stage 1: build React frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python backend + serve frontend ────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install backend deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Create data directory (mount a Railway volume here for persistence)
RUN mkdir -p /app/data/uploads

ENV DATABASE_URL=sqlite:////app/data/civilnobre.db
ENV UPLOAD_DIR=/app/data/uploads
ENV PYTHONPATH=/app/backend

EXPOSE 8000

CMD ["sh", "-c", "cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
