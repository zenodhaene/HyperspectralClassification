docker build -t hyperspectralclassification/backend:latest -f backend/backend/Dockerfile backend/
docker build -t hyperspectralclassification/frontend:latest -f frontend/Dockerfile frontend/
docker build -t hyperspectralclassification/pythonapi:latest -f python/api/Dockerfile python/api/