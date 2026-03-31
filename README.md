# CarKit

CarKit is a comprehensive mobile utility and commerce application designed to provide automotive services, vehicle management tools, and an integrated marketplace for automotive products. Built with a focus on delivering a premium user experience, CarKit features a dynamic, responsive design system supporting custom light and dark themes.

## Key Features

- **Dynamic Theming System:** Full support for system-default, light, and dark modes with a custom premium aesthetic and fluid theme transitions.
- **Service Booking & Marketplace:** Integrated platform for purchasing automotive products and booking vehicle services.
- **Vendor Management:** Capabilities for vendor onboarding and document uploads.
- **Secure Authentication:** Integrated user authentication, authorization, and secure sessions.
- **Cross-Platform Compatibility:** Unified codebase delivering native experiences on both iOS and Android.

## Technology Stack

### Frontend
- **React Native (v0.81)**
- **Expo (SDK 54)**
- **TypeScript** for static type checking and enhanced developer experience
- **Expo Router** for file-based routing and deep linking
- **React Context** for global state management (Authentication, Cart, Theme, etc.)
- **Custom UI Components:** High-performance animations and custom-styled elements (e.g., custom toast notifications, blur effects)
- **Typography:** @expo-google-fonts/poppins

### Backend & Infrastructure
- **Supabase:** Primary backend providing PostgreSQL database, authentications, and storage solutions.
- **Node.js / Express:** Dedicated administrative server backend (hosted via Render).

## Getting Started

### Prerequisites

Ensure the following dependencies are installed on your local development environment:
- **Node.js** (v18.0.0 or later)
- **npm** (included with Node.js)
- **Expo Go** application installed on your physical device for testing (or Android Studio / Xcode for emulator/simulator support)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/muuhamedhany/CarKitApp.git
cd CarKitApp
```

2. Install dependencies:
```bash
npm install
```

3. Environment Configuration:
Ensure you have the required environment variables populated in your `.env` file (e.g., Supabase URL, API keys).

4. Start the development server:
```bash
npx expo start
```

## Available Scripts

- `npm start` - Starts the Expo development server.
- `npm run android` - Starts the server and opens the app on a connected Android device or emulator.
- `npm run ios` - Starts the server and opens the app on an iOS simulator.
- `npm run lint` - Runs ESLint to statically analyze the code for issues.

## Project Architecture

```
CarKitApp/
├── app/              # File-based routing maps and screen components
├── assets/           # Static assets, fonts, and images
├── components/       # Reusable, stateless UI components
├── constants/        # Global constants, theme definitions, and color palettes
├── contexts/         # React Context providers for global state
├── hooks/            # Custom React hooks
├── scripts/          # Build and deployment utility scripts
├── services/         # API integration and external service layers
├── .env              # Environment variables configuration
├── app.json          # Expo environment configuration
├── package.json      # Project metadata and dependencies
└── tsconfig.json     # TypeScript compiler configuration
```

## Troubleshooting

- **Metro bundler fails to start:** Run `npx expo start --clear` to reset the Metro bundler cache.
- **Dependency synchronization issues:** Remove the `node_modules` directory and `package-lock.json`, then execute `npm install`.
- **Network connection failures in Expo Go:** Verify that your mobile device and development machine are connected to the same local network subnet.
- **Type validation:** Run `npx tsc --noEmit` to validate TypeScript compilation across the project.
