# Project Structure Documentation

## Overview
This document outlines the project structure, organization, and architecture.

## Project Organization

### 1. Directory Structure
```
project/
├── apps/
│   ├── terrafield-mobile/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── terrafield-web/
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   ├── utils/
│       │   └── App.tsx
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── database/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── PROJECT_STRUCTURE.md
├── scripts/
│   ├── build.sh
│   ├── deploy.sh
│   └── test.sh
├── .gitignore
├── package.json
└── README.md
```

### 2. Package Structure
1. Apps
   - Mobile app
   - Web app
   - Admin app

2. Packages
   - Core package
   - Shared package
   - UI package

3. Documentation
   - API documentation
   - Database documentation
   - Deployment documentation

### 3. Configuration Files
1. Package Configuration
```json
{
  "name": "project",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "format": "lerna run format"
  },
  "devDependencies": {
    "lerna": "^4.0.0",
    "typescript": "^4.5.0"
  }
}
```

2. TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018", "dom"],
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

3. Lerna Configuration
```json
{
  "packages": ["apps/*", "packages/*"],
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  }
}
```

## Project Architecture

### 1. Application Architecture
1. Mobile App
```
apps/terrafield-mobile/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   └── storage/
│   ├── utils/
│   │   ├── constants/
│   │   ├── helpers/
│   │   └── types/
│   └── App.tsx
├── package.json
└── tsconfig.json
```

2. Web App
```
apps/terrafield-web/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   └── storage/
│   ├── utils/
│   │   ├── constants/
│   │   ├── helpers/
│   │   └── types/
│   └── App.tsx
├── package.json
└── tsconfig.json
```

3. Admin App
```
apps/terrafield-admin/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   └── storage/
│   ├── utils/
│   │   ├── constants/
│   │   ├── helpers/
│   │   └── types/
│   └── App.tsx
├── package.json
└── tsconfig.json
```

### 2. Package Architecture
1. Core Package
```
packages/core/
├── src/
│   ├── database/
│   │   ├── models/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── models/
│   │   ├── Property.ts
│   │   ├── Valuation.ts
│   │   └── User.ts
│   └── utils/
│       ├── constants/
│       ├── helpers/
│       └── types/
├── package.json
└── tsconfig.json
```

2. Shared Package
```
packages/shared/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   ├── hooks/
│   │   ├── useAuth/
│   │   ├── useForm/
│   │   └── useQuery/
│   └── utils/
│       ├── constants/
│       ├── helpers/
│       └── types/
├── package.json
└── tsconfig.json
```

3. UI Package
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   ├── themes/
│   │   ├── light/
│   │   └── dark/
│   └── utils/
│       ├── constants/
│       ├── helpers/
│       └── types/
├── package.json
└── tsconfig.json
```

### 3. Documentation Architecture
1. API Documentation
```
docs/
├── API.md
├── api/
│   ├── endpoints/
│   │   ├── properties.md
│   │   ├── valuations.md
│   │   └── users.md
│   └── models/
│       ├── Property.md
│       ├── Valuation.md
│       └── User.md
```

2. Database Documentation
```
docs/
├── DATABASE.md
├── database/
│   ├── schema/
│   │   ├── properties.md
│   │   ├── valuations.md
│   │   └── users.md
│   └── migrations/
│       ├── 001_initial.md
│       ├── 002_add_indexes.md
│       └── 003_add_constraints.md
```

3. Deployment Documentation
```
docs/
├── DEPLOYMENT.md
├── deployment/
│   ├── infrastructure/
│   │   ├── aws.md
│   │   ├── azure.md
│   │   └── gcp.md
│   └── applications/
│       ├── mobile.md
│       ├── web.md
│       └── admin.md
```

## Project Workflow

### 1. Development Workflow
1. Branch Strategy
```
main
├── develop
│   ├── feature/
│   │   ├── feature-1
│   │   └── feature-2
│   ├── bugfix/
│   │   ├── bugfix-1
│   │   └── bugfix-2
│   └── release/
│       ├── release-1
│       └── release-2
└── hotfix/
    ├── hotfix-1
    └── hotfix-2
```

2. Commit Strategy
```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

3. Release Strategy
```
1.0.0
├── 1.0.0-beta.1
├── 1.0.0-beta.2
├── 1.0.0-rc.1
└── 1.0.0
```

### 2. Testing Workflow
1. Unit Tests
```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
```

2. Integration Tests
```
tests/
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
```

3. End-to-End Tests
```
tests/
├── e2e/
│   ├── mobile/
│   ├── web/
│   └── admin/
```

### 3. Deployment Workflow
1. Development
```
develop
├── build
├── test
└── deploy
```

2. Staging
```
staging
├── build
├── test
└── deploy
```

3. Production
```
production
├── build
├── test
└── deploy
```

## Project Dependencies

### 1. Development Dependencies
1. Build Tools
```json
{
  "devDependencies": {
    "typescript": "^4.5.0",
    "babel": "^7.16.0",
    "webpack": "^5.65.0"
  }
}
```

2. Testing Tools
```json
{
  "devDependencies": {
    "jest": "^27.4.0",
    "cypress": "^9.0.0",
    "testing-library": "^12.0.0"
  }
}
```

3. Linting Tools
```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^2.5.0",
    "stylelint": "^14.0.0"
  }
}
```

### 2. Runtime Dependencies
1. Framework
```json
{
  "dependencies": {
    "react": "^17.0.0",
    "react-native": "^0.66.0",
    "next": "^12.0.0"
  }
}
```

2. State Management
```json
{
  "dependencies": {
    "redux": "^4.1.0",
    "redux-toolkit": "^1.8.0",
    "react-query": "^3.0.0"
  }
}
```

3. UI Components
```json
{
  "dependencies": {
    "material-ui": "^5.0.0",
    "styled-components": "^5.3.0",
    "tailwindcss": "^3.0.0"
  }
}
```

### 3. Build Dependencies
1. Mobile
```json
{
  "dependencies": {
    "react-native": "^0.66.0",
    "expo": "^44.0.0",
    "react-navigation": "^6.0.0"
  }
}
```

2. Web
```json
{
  "dependencies": {
    "next": "^12.0.0",
    "react": "^17.0.0",
    "react-dom": "^17.0.0"
  }
}
```

3. Admin
```json
{
  "dependencies": {
    "next": "^12.0.0",
    "react": "^17.0.0",
    "react-dom": "^17.0.0"
  }
}
```

## Project Configuration

### 1. Environment Configuration
1. Development
```env
# Development environment variables
NODE_ENV=development
API_URL=http://localhost:3000
DB_URL=postgresql://user:password@localhost:5432/database
```

2. Staging
```env
# Staging environment variables
NODE_ENV=staging
API_URL=https://staging-api.example.com
DB_URL=postgresql://user:password@staging-db.example.com:5432/database
```

3. Production
```env
# Production environment variables
NODE_ENV=production
API_URL=https://api.example.com
DB_URL=postgresql://user:password@production-db.example.com:5432/database
```

### 2. Build Configuration
1. Mobile
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

2. Web
```json
{
  "build": {
    "development": {
      "env": "development",
      "port": 3000
    },
    "staging": {
      "env": "staging",
      "port": 3000
    },
    "production": {
      "env": "production",
      "port": 3000
    }
  }
}
```

3. Admin
```json
{
  "build": {
    "development": {
      "env": "development",
      "port": 3001
    },
    "staging": {
      "env": "staging",
      "port": 3001
    },
    "production": {
      "env": "production",
      "port": 3001
    }
  }
}
```

### 3. Test Configuration
1. Unit Tests
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    "transform": {
      "^.+\\.ts$": "ts-jest"
    }
  }
}
```

2. Integration Tests
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    "transform": {
      "^.+\\.ts$": "ts-jest"
    },
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"]
  }
}
```

3. End-to-End Tests
```json
{
  "cypress": {
    "baseUrl": "http://localhost:3000",
    "video": false,
    "screenshotOnRunFailure": true,
    "trashAssetsBeforeRuns": true
  }
}
``` 