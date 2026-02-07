# BizFlow - Digital Transformation Platform 🚀

BizFlow is a specialized Digital Transformation Platform designed for Vietnamese household businesses. It streamlines operations across inventory management, sales (POS), debt tracking, and AI-driven business insights.

## 🏗️ Architecture & Tech Stack

The system follows a modern micro-service-ready architecture with a clear separation of concerns.

- **Backend**: FastAPI (Python 3.11+) - High performance, asynchronous API.
- **Frontend Web**: Next.js 14 (React) - Server-side rendering for speed and SEO.
- **Primary Database**: MySQL 8.0 - Relational data for core business logic.
- **Reporting Database**: PostgreSQL 15 - Optimized for analytical views and reporting.
- **Caching & Events**: Redis 7 - Idempotency handling and temporary data.
- **AI Engine**: ChromaDB + Gemini/OpenAI - RAG-based business intelligence.
- **Deployment**: Docker & Docker Compose.

## 📁 Repository Structure

```text
CNPM/
├── backend/            # FastAPI Source Code
│   ├── api/            # API Endpoints (v1)
│   ├── domain/         # Business Entities & Logic
│   ├── infrastructure/ # DB Repositories & External Services
│   ├── usecases/       # Application Logic (Interactors)
│   ├── alembic/        # Database Migrations
│   ├── database/       # SQL Schemas and Seed Data
│   └── main.py         # Application Entry Point
├── frontend/
│   └── web/            # Next.js Web Application (Management Portal & POS)
├── docker-compose.yml  # System-wide orchestration
├── .env.example        # Template for environment variables
└── README.md           # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose installed.
- Git.

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/DanielNguyen999/CNPM.git
   cd CNPM
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env and provide your AI API keys (optional but recommended for AI features)
   ```

3. **Launch the System**
   ```bash
   docker compose up --build -d
   ```

4. **Access the Applications**
   - **Management Portal (Web)**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)

## 👥 Default Demo Accounts

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `password123` | System-wide configuration & User management |
| **Owner** | `owner` | `password123` | Store management, Reports, Inventory |
| **Employee** | `employee` | `password123` | Sales operations, POS, Customer service |
| **Customer** | `customer` | `password123` | Portal access for tracking orders/debts |

## 🛡️ Security Note
This repository contains production-ready source code. Always change default credentials and rotate keys before deploying to a public environment.

---
© 2024 BizFlow Team. All rights reserved.
