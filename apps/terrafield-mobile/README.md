# TerraField Mobile

A React Native mobile application for managing agricultural fields and field data.

## Features

- Field mapping and visualization
- Field data management
- Area calculations
- Soil and crop type tracking
- Offline data persistence
- Real-time GPS tracking

## Prerequisites

- Node.js >= 14
- React Native development environment setup
- iOS: XCode >= 12
- Android: Android Studio and Android SDK

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/terrafield-mobile.git
cd terrafield-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies:
```bash
cd ios && pod install && cd ..
```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── screens/        # Screen components
  ├── navigation/     # Navigation configuration
  ├── store/         # Redux store and actions
  ├── services/      # Business logic and API calls
  ├── types/         # TypeScript type definitions
  ├── utils/         # Utility functions
  └── theme/         # Theme configuration
```

## Development

### Code Style

We use ESLint and Prettier for code formatting. Run the linter:

```bash
npm run lint
```

### Testing

Run tests:

```bash
npm test
```

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
