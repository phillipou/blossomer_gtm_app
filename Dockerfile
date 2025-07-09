# syntax=docker/dockerfile:1

FROM python:3.11-slim AS builder

# System deps
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_VERSION=1.7.1
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s /root/.local/bin/poetry /usr/local/bin/poetry

# Set workdir
WORKDIR /app

# Copy only dependency files first for caching
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev deps)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Copy app code
COPY backend/ ./backend/
# Use a heredoc to create the .env.example file
RUN <<EOF cat > .env.example
# Example environment variables for blossomer-gtm-app

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blossomer

# API
API_KEY=your-api-key

# Other settings
ENV=production
EOF

# --- Final image ---
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/.env.example ./

# Install Gunicorn as root
RUN pip install gunicorn

# Create non-root user
RUN useradd -m appuser
USER appuser

# Set env vars
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENV=production \
    PYTHONPATH=/app/backend \
    LOG_LEVEL=info

EXPOSE 8000

# (Optional) Add a Docker healthcheck for /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Entrypoint: Gunicorn with Uvicorn workers
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "app.api.main:app", "--log-level", "info"] 