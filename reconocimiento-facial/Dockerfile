FROM python:3.11-slim

# dlib (dependencia de face_recognition) necesita compilar C++ — esto puede
# tardar varios minutos en una VPS de 1 vCPU.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "servidor_reconocimiento.py"]
