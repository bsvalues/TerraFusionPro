# TerraFusion Development Environment Setup

## Prerequisites

### System Requirements
- Node.js >= 18.0.0
- Docker Desktop
- Kubernetes (minikube or local cluster)
- Git
- VS Code or preferred IDE

### Required Tools
- Yarn package manager
- Docker Compose
- kubectl
- PostgreSQL client
- Redis client

## Environment Setup

### 1. Repository Setup
```bash
git clone https://github.com/your-org/terrafusion.git
cd terrafusion
```

### 2. Development Tools Installation
```bash
# Install dependencies
yarn install

# Enable corepack
corepack enable

# Setup git hooks
yarn prepare
```

### 3. Docker Environment
```bash
# Start development containers
docker-compose up -d

# Verify containers
docker-compose ps
```

### 4. Database Setup
```bash
# Run migrations
yarn db:migrate

# Seed development data
yarn db:seed
```

### 5. Development Server
```bash
# Start development server
yarn dev

# Run tests
yarn test

# Lint code
yarn lint
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/terrafusion
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Environment
NODE_ENV=development
PORT=5000
```

## Development Workflow

### 1. Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write unit tests for new features
- Document code changes

### 2. Git Workflow
- Create feature branches from main
- Follow conventional commits
- Submit PRs for review
- Keep commits atomic

### 3. Testing
- Write unit tests
- Run integration tests
- Perform E2E testing
- Check performance metrics

### 4. Documentation
- Update API documentation
- Maintain README files
- Document architecture decisions
- Keep changelog updated

## Troubleshooting

### Common Issues
1. Docker container issues
   - Check Docker Desktop status
   - Verify port availability
   - Check container logs

2. Database connection issues
   - Verify PostgreSQL is running
   - Check connection string
   - Verify network settings

3. Development server issues
   - Clear node_modules
   - Check port availability
   - Verify environment variables

## Support

For development environment issues:
1. Check the troubleshooting guide
2. Review documentation
3. Contact DevOps team
4. Submit issue on GitHub 