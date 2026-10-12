# syntax=docker/dockerfile:1
FROM python:3.11-slim

# Set environment variables for clean container output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

WORKDIR /app

# Install project dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend modules and frontend static lab assets
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose Flask API and web portal port
EXPOSE 5000

# Run the Flask server bound to 0.0.0.0
CMD ["python", "backend/app.py"]
