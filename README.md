# TG_ERP: Telegram-Integrated Enterprise Resource Planning System

## Project Overview

TG_ERP is a comprehensive ERP system that leverages Telegram's ecosystem to provide a seamless mobile-first experience for organizational management. The system offers flexible organizational structure views, meeting management, document collaboration, and a plugin-based architecture for extensibility.

## Key Features

- **Telegram Integration**: Authentication and interactions via Telegram
- **Organizational Structure**: Multiple organizational models (hierarchical, holonic, matrix, tribes)
- **Meeting Management**: Schedule, conduct, and record meetings with integrated chat functionality
- **Document Collaboration**: Real-time collaborative editing with version control
- **Plugin Marketplace**: Modular architecture for extensible functionality
- **Mobile-First Design**: Optimized for mobile devices with responsive interfaces

## Architecture

TG_ERP is built on a microservices architecture with the following components:

- **API Gateway**: Central entry point for client requests
- **Auth & ACL Service**: Authentication and access control
- **Org Structure Service**: Organizational hierarchy and relationships
- **Communication Service**: Notifications and chat management
- **Project & Initiative Service**: Meeting and project management
- **Workplace Service**: Document editing and file management
- **Message Broker**: Event-driven communication between services

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Telegram Bot API credentials

### Local Development Setup

1. Clone the repository
2. Navigate to the `docker` directory
3. Run `docker-compose up` to start all services
4. See the [Developer Documentation](./docs/developer-guide.md) for more details

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on the process for submitting pull requests.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md) that all contributors are expected to follow.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
