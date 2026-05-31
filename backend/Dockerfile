FROM python:3.11-slim

WORKDIR /app

# System dependencies for psycopg2 and geoalchemy2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip first
RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory
RUN mkdir -p uploads chroma_data

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
