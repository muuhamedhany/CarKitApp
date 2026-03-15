# CarKit — React Native Mobile App 🚗

CarKit is a cross-platform mobile application built with **React Native** and **Expo**. It uses file-based routing via [Expo Router](https://docs.expo.dev/router/introduction) and is written in **TypeScript**.

---

## Prerequisites

Before you begin, make sure the following are installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18 or later | [nodejs.org](https://nodejs.org/) |
| **npm** | comes with Node.js | — |
| **Expo CLI** | latest | installed automatically via `npx` |
| **Expo Go** (mobile) | latest | [App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |

> **Optional:** To run on an emulator/simulator, install [Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/) or [Xcode](https://docs.expo.dev/workflow/ios-simulator/) (macOS only).

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/muuhamedhany/CarKitApp
cd CarKitApp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npx expo start
```

This will open the **Expo DevTools** in your terminal. From there you can:

- Press **`a`** — open on a connected Android device / emulator
- Press **`i`** — open on the iOS Simulator (macOS only)
- Press **`w`** — open in a web browser
- **Scan the QR code** with the **Expo Go** app on your phone

---

## Platform-Specific Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo development server |
| `npm run android` | Start and open on Android |
| `npm run ios` | Start and open on iOS |
| `npm run web` | Start and open in a web browser |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Reset to a blank project |

---

## Project Structure

```
CarKitApp/
├── app/              # Screens & routes (file-based routing)
├── assets/           # Images, fonts, and static files
├── components/       # Reusable UI components
├── constants/        # Theme, colors, and config values
├── contexts/         # React Context providers (Auth, Cart, etc.)
├── hooks/            # Custom React hooks
├── scripts/          # Utility scripts
├── app.json          # Expo configuration
├── package.json      # Dependencies & scripts
└── tsconfig.json     # TypeScript configuration
```

---

## Tech Stack

- **React Native** 0.81 + **Expo** SDK 54
- **TypeScript**
- **Expo Router** (file-based routing)
- **React Navigation** (bottom tabs)
- **Expo Image**, **Linear Gradient**, **Haptics**, and more
- **Poppins** font via `@expo-google-fonts/poppins`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Metro bundler not starting | Run `npx expo start --clear` to clear the cache |
| Dependencies out of sync | Delete `node_modules` and run `npm install` again |
| Expo Go can't connect | Ensure your phone and PC are on the **same Wi-Fi network** |
| TypeScript errors | Run `npx tsc --noEmit` to check for type issues |
