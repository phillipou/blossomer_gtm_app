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
COPY src/ ./src/
# Use a heredoc to create the .env.example file
RUN <<EOF cat > .env.example
# Example environment variables for blossomer-gtm-api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blossomer

# Supabase
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-key

# API
API_KEY=your-api-key

# Other settings
ENV=development
EOF

# --- Final image ---
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app/src ./src
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
    PYTHONPATH=/app/src

EXPOSE 8000

# Entrypoint: Gunicorn with Uvicorn workers
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "src.blossomer_gtm_api.main:app"] 