# Contributing to TG_ERP

Thank you for considering contributing to TG_ERP! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- Check the issue tracker to see if the bug has already been reported
- If not, create a new issue with a clear title and description
- Include steps to reproduce the bug, expected behavior, and actual behavior
- Include screenshots if applicable
- Provide information about your environment (OS, browser, etc.)

### Suggesting Enhancements

- Check the issue tracker to see if the enhancement has already been suggested
- If not, create a new issue with a clear title and description
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

## Development Workflow

### Setting Up the Development Environment

1. Clone the repository
2. Install Docker and Docker Compose
3. Navigate to the `docker` directory
4. Run `docker-compose up` to start all services

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style (EditorConfig and linting rules are provided)
- Write tests for all new features and bug fixes
- Document all public API methods and classes

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Branch Naming Convention

- `feature/`: For new features
- `bugfix/`: For bug fixes
- `docs/`: For documentation changes
- `refactor/`: For code refactoring
- `test/`: For adding or modifying tests

## Service Development Guidelines

### Microservice Architecture

- Each service should be self-contained and independently deployable
- Services should communicate via the Message Broker
- Use the provided service template for new services

### API Design

- Follow RESTful API conventions
- Document all endpoints using OpenAPI/Swagger
- Implement proper error handling and response codes

### Testing

- Write unit tests for all services
- Write integration tests for service interactions
- Use the provided test setup for consistency

Thank you for contributing to TG_ERP!
