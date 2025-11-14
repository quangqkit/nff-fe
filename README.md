# NFF Auto Report

A comprehensive automated reporting system built with microservices architecture

## 🏗️ Architecture

This project follows a microservices architecture with the following components:

- **API Gateway** (`nff-api-gateway`): NestJS-based API gateway for routing and authentication
- **Data Ingestion** (`nff-data-ingestion`): Python service for data crawling and processing
- **Web UI** (`nff-web-ui`): Next.js frontend application
- **Shared** (`shared`): Common utilities, types, and constants
- **Infrastructure**: Docker and deployment configurations

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.8+

### Running the Application

1. Clone the repository:
```bash
git clone <repository-url>
cd NFF-Auto-Report
```

2. Start all services:
```bash
docker-compose -f docker-compose.production.yml up -d
```

3. Access the services:
- **Web UI**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **Data Ingestion**: http://localhost:8000

## 📁 Project Structure

```
NFF-Auto-Report/
├── .github/           # GitHub Actions workflows
├── infrastructure/    # Infrastructure configurations
├── services/          # Microservices
│   ├── nff-api-gateway/    # NestJS API Gateway
│   ├── nff-data-ingestion/ # Python Data Service
│   └── nff-web-ui/         # Next.js Frontend
├── shared/            # Shared utilities and types
├── docker-compose.production.yml # Docker orchestration (production)
├── docker-compose.dev.yml # Docker orchestration (development)
└── README.md          # This file
```

## 🛠️ Development

### Development với Docker (Recommended)

Sử dụng `docker-compose.dev.yml` cho development với hot reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Tính năng:**
- ✅ Hot reload cho API Gateway
- ✅ Volume mounts cho source code
- ✅ Development environment variables
- ✅ Faster startup

Xem thêm: **[Dockerfile Optimization Guide](./docs/dockerfile-optimization.md)**

### Development Local (không dùng Docker)

#### API Gateway
```bash
cd services/nff-api-gateway
npm install
npm run start:dev
```

#### Web UI
```bash
cd services/nff-web-ui
npm install
npm run dev
```

#### Data Ingestion
```bash
cd services/nff-data-ingestion
pip install -r requirements.txt
python app/main.py
```

## 🧪 Testing

Run tests for all services:
```bash
# API Gateway
cd services/nff-api-gateway && npm test

# Web UI
cd services/nff-web-ui && npm test
```

## 📦 Deployment

### Production với Docker

The application is containerized and can be deployed using Docker:

```bash
# Build và start production environment
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop
docker-compose -f docker-compose.production.yml down
```

### Deploy to Production (Docker Hub & VPS)

Xem hướng dẫn chi tiết về cách push Docker images lên Docker Hub và deploy trên VPS:
- **[Hướng dẫn Docker Hub Deployment](./docs/docker-hub-deployment.md)** (Tiếng Việt)
- **[Dockerfile Optimization Guide](./docs/dockerfile-optimization.md)** - Development vs Production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
