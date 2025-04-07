# TG_ERP Developer Guide

This guide provides instructions for setting up your development environment and working with the TG_ERP microservices architecture.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Microservices Architecture](#microservices-architecture)
4. [Telegram Integration](#telegram-integration)
5. [Database Configuration](#database-configuration)
6. [Message Broker Setup](#message-broker-setup)
7. [Testing Guidelines](#testing-guidelines)
8. [CI/CD Pipeline](#cicd-pipeline)

## Development Environment Setup

### Prerequisites

- Git
- Docker and Docker Compose
- Node.js (v18 or later)
- npm or yarn
- Telegram Bot API credentials

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-organization/tg-erp.git
   cd tg-erp
   ```

2. **Install dependencies**

   ```bash
   # Install root-level dependencies
   npm install
   
   # Install service-specific dependencies
   cd services/auth-service
   npm install
   # Repeat for other services
   ```

3. **Environment Configuration**

   Copy the example environment files:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your specific configurations, including:
   - Database connection strings
   - Telegram Bot API credentials
   - Service ports
   - Message broker connection details

4. **Start the development environment**

   ```bash
   # From the root directory
   cd docker
   docker-compose up
   ```

   This will start all required services:
   - API Gateway
   - Microservices (Auth, Org Structure, etc.)
   - Databases (PostgreSQL, MongoDB, Neo4j, InfluxDB)
   - Message Broker (Kafka/RabbitMQ)

### Development Workflow

1. Run the services in development mode for hot-reloading:

   ```bash
   # Start a specific service in development mode
   cd services/auth-service
   npm run dev
   ```

2. Access the API Gateway at `http://localhost:3000`

3. Use the Telegram Bot by messaging the bot you've configured

## Project Structure

```
tg-erp/
├── services/                # Microservices
│   ├── api-gateway/         # API Gateway service
│   ├── auth-service/        # Authentication service
│   ├── org-service/         # Organization structure service
│   ├── communication-service/ # Communication service
│   ├── project-service/     # Project and meeting service
│   └── workplace-service/   # Document and file management service
├── docs/                    # Documentation
├── docker/                  # Docker configurations
│   ├── docker-compose.yml   # Main composition file
│   └── */                   # Service-specific Docker configurations
├── scripts/                 # Utility scripts
└── ...
```

Each service follows a standard structure:

```
service-name/
├── src/                     # Source code
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── middleware/          # Middleware functions
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── events/              # Event handlers for message broker
│   └── index.ts             # Entry point
├── tests/                   # Test files
├── Dockerfile               # Docker configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Microservices Architecture

TG_ERP follows a microservices architecture with these key components:

### API Gateway

- Routes requests to appropriate services
- Handles authentication and authorization
- Manages rate limiting and logging
- Aggregates responses when needed

### Auth & ACL Service

- Handles user registration via Telegram ID
- Manages authentication and JWT generation
- Implements two-factor authentication via Telegram
- Controls access through role-based permissions

### Org Structure Service

- Maintains organizational hierarchy and relationships
- Supports multiple organizational models (hierarchy, holons, matrix, tribes)
- Provides personalized views based on user context

### Communication Service

- Manages notification delivery
- Creates temporary meeting channels
- Handles chat-based communications

### Project & Initiative Service

- Schedules and manages meetings
- Provides calendar functionality
- Tracks agendas and action items

### Workplace Service

- Enables collaborative document editing
- Manages file storage and version control
- Implements check-in functionality

## Telegram Integration

### Bot API Integration

1. Create a Telegram Bot through BotFather
2. Configure your bot token in the `.env` file
3. Implement webhook handling for bot commands

### Telegram Web Apps

1. Configure your bot to use Web Apps
2. Implement Web App interfaces using HTML/CSS/JS
3. Connect Web Apps to the backend services

## Database Configuration

TG_ERP uses multiple database technologies:

### PostgreSQL

Used for structured, transactional data:
- User accounts and authentication
- Meeting and project data
- Core business entities

### MongoDB

Used for document storage:
- Collaborative documents
- File metadata
- Unstructured content

### Neo4j

Used for graph relationships:
- Organizational structure
- User relationships and permissions
- Complex hierarchical data

### InfluxDB

Used for time-series data:
- System metrics
- User activity logs
- Performance monitoring

## Message Broker Setup

TG_ERP uses a message broker for asynchronous communication between services:

### Kafka/RabbitMQ Configuration

1. Configure connection settings in `.env`
2. Define topics/queues for different event types
3. Implement producers and consumers in each service

### Event Types

- `user.registered`: New user registration
- `meeting.created`: New meeting creation
- `document.updated`: Document updates
- `notification.created`: New notification

## Testing Guidelines

### Unit Testing

- Write unit tests for all business logic
- Use Jest as the testing framework
- Aim for high test coverage

### Integration Testing

- Test service interactions
- Use a test message broker
- Configure test databases

### End-to-End Testing

- Test complete user workflows
- Simulate Telegram Bot interactions
- Use Cypress for UI testing

## CI/CD Pipeline

The CI/CD pipeline is configured using GitHub Actions:

### Continuous Integration

- Runs on each push and pull request
- Executes linting and unit tests
- Builds Docker images

### Continuous Deployment

- Development environment: Local WSL for development and testing
- Staging environment: Hetzner Cloud VPS (deployed on merge to develop branch)
- Production environment: Hetzner Cloud VPS (deployed on merge to main branch)
- Deployment strategy: Docker-compose based deployment via SSH
- Includes database migrations and environment configuration

### Deployment Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  Local Dev (WSL)│     │  Staging (Hetzner)│     │ Production (Hetzner)│
│                 │     │                   │     │                     │
│  Docker Compose │────▶│  Docker Compose   │────▶│  Docker Compose     │
│  All Services   │     │  All Services     │     │  All Services       │
└─────────────────┘     └───────────────────┘     └───────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ Local Databases │     │ Staging Databases │     │ Prod Databases    │
│ & Message Broker│     │ & Message Broker  │     │ & Message Broker  │
└─────────────────┘     └───────────────────┘     └───────────────────┘
```

### Monitoring

- Collects logs and metrics
- Alerts on service disruptions
- Provides performance dashboards
