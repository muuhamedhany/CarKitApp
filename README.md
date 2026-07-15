# CarKit App

CarKit is an Expo + React Native mobile app for automotive commerce and utility workflows, including product shopping, service booking, vehicle management, and vendor/provider operations.

## Features

- Authentication flows for customers, providers, and vendors
- Service booking and automotive marketplace journeys
- Vehicle management and profile/account management
- Vendor/provider dashboards and management screens
- Dynamic light/dark theming and reusable UI system
- Localization support through the `locales/` module

## Tech Stack

- React Native `0.81`
- Expo SDK `54`
- TypeScript
- Expo Router (file-based routing)
- React Context + Zustand state management
- Supabase (auth, database, storage)

## Project Structure

```text
CarKitApp/
├── app/          # Route screens (Expo Router)
├── assets/       # Images, fonts, static assets
├── components/   # Reusable UI components
├── constants/    # Design tokens and app constants
├── contexts/     # React context providers
├── hooks/        # Custom hooks
├── lib/          # Shared integrations (e.g. Supabase client)
├── locales/      # Translation resources
├── services/     # API/service layer
├── store/        # Zustand stores
└── utils/        # Utility helpers
```

## Prerequisites

- Node.js `18+`
- npm `9+`
- Expo Go app (or Android Studio / Xcode simulators)

## Setup

1. Clone and install dependencies:

   ```bash
   git clone https://github.com/muuhamedhany/CarKitApp.git
   cd CarKitApp
   npm install
   ```

2. Create `.env` in the project root and set:

   ```env
   EXPO_PUBLIC_API_URL=
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Start the app:

   ```bash
   npm start
   ```

## Scripts

- `npm start` — start Expo dev server
- `npm run android` — run on Android
- `npm run ios` — run on iOS simulator
- `npm run web` — run web target
- `npm run lint` — run Expo/ESLint checks
- `npm run reset-project` — reset Expo sample project artifacts

## Validation

- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`

## Troubleshooting

- If Metro cache causes issues: `npx expo start --clear`
- If dependencies are corrupted: remove `node_modules` and reinstall
- Ensure your simulator/device can access your local dev server
