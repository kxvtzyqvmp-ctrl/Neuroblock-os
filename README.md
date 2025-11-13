# NeuroBlock OS

A comprehensive digital detox and focus management application built with React Native and Expo.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (install globally: `npm install -g expo-cli`)
- EAS CLI (install globally: `npm install -g eas-cli`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

Or use the dev script:
```bash
npm run dev
```

### Platform-Specific Commands

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## 📦 Building with EAS

This project is configured for EAS (Expo Application Services) builds.

### Build Profiles

- **Development**: Development client with debugging
- **Preview**: Internal distribution build (APK for Android)
- **Production**: Production-ready build for app stores

### Building

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Both platforms
eas build --platform all
```

### Building for specific profile

```bash
# Preview build
eas build --profile preview --platform android

# Production build
eas build --profile production --platform android
```

## 🏗️ Project Structure

```
.
├── app/                  # Expo Router app directory
├── assets/              # Images and static assets
├── components/          # React components
├── contexts/            # React contexts (Auth, Theme)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and services
├── modules/             # Native modules
├── types/               # TypeScript type definitions
├── supabase/            # Supabase functions and migrations
├── app.json             # Expo configuration
├── eas.json             # EAS build configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## 🔧 Configuration

### Expo Configuration

The project is configured in `app.json` with:
- Project ID: `06ce092c-e8c5-4055-a94a-2bcaeef77676`
- Owner: `thlangu`
- Bundle Identifier: `com.harmonicminds.neuroblockos`
- Package Name: `com.harmonicminds.neuroblockos`

### EAS Configuration

EAS build configuration is in `eas.json` with profiles for:
- Development builds
- Preview builds (internal distribution)
- Production builds

## 📱 Features

- App blocking and management
- Digital detox scheduling
- AI-powered insights and coaching
- Family linking and support
- Analytics and usage tracking
- Custom focus modes
- Environment monitoring
- Community features

## 🛠️ Development

### TypeScript

Type checking:
```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Web Build

```bash
npm run build:web
```

## 📝 Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web
- `npm run dev` - Start with no telemetry
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run build:web` - Build for web

## 🔐 Environment Variables

Create a `.env` file in the root directory with your environment variables. See `.gitignore` for excluded files.

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. For questions or support, please contact the project owner.

## 📞 Support

For issues or questions, please contact the project maintainer.

