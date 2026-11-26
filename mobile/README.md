# Behishebi - Mobile App Integration Guide

This directory contains the mobile SDK client and sample React Native code for **Behishebi**.

The Next.js backend provides a complete RESTful API under `/api/v1/` designed specifically for iOS and Android applications.

---

## 🚀 Quick Setup for Mobile

### 1. Using the Mobile SDK
Copy `mobile/HishabClient.ts` into your React Native, Expo, or Flutter project.

```typescript
import { HishabMobileClient } from './HishabClient';

// For local Android Emulator: use http://10.0.2.2:3000
// For local iOS Simulator: use http://localhost:3000
// For Production: use your deployed URL (e.g. https://behishebi.vercel.app)
const client = new HishabMobileClient({
  baseUrl: 'https://your-app-domain.com',
});

// Authenticate session
await client.login('naufal@example.com', 'your-password');

// Fetch instant dashboard
const dashboard = await client.getDashboard();
console.log('Balance:', dashboard.totalBalance);
```

---

## 📡 Dedicated Mobile API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Mobile authentication returning Bearer token & API key |
| `GET` | `/api/v1/auth/profile` | Get user profile & currency settings |
| `PUT` | `/api/v1/auth/profile` | Update profile information |
| `GET` | `/api/v1/dashboard` | One-call mobile dashboard payload (Balance, trends, goals, recent tx) |
| `GET` | `/api/v1/transactions` | Query transactions (`?q=...&category=...&type=income&limit=20`) |
| `POST` | `/api/v1/transactions` | Create new transaction |
| `GET` | `/api/v1/transactions/:id` | Get transaction details |
| `PUT` | `/api/v1/transactions/:id` | Update transaction |
| `DELETE` | `/api/v1/transactions/:id` | Delete transaction |
| `GET` | `/api/v1/savings` | List all savings goals |
| `POST` | `/api/v1/savings` | Create new savings goal |
| `POST` | `/api/v1/savings/:id/deposit` | Add funds/deposit to savings goal |
| `DELETE` | `/api/v1/savings/:id` | Delete goal |
| `GET` | `/api/v1/wallets` | List accounts, cards, and balances |
| `POST` | `/api/v1/wallets/transfer` | Transfer funds between accounts |
| `GET` | `/api/v1/analytics` | Category breakdown & monthly cashflow |
| `GET` | `/api/v1/budgets` | Budgets and progress percentages |
| `POST` | `/api/v1/scan` | Receipt scanner OCR parser |
| `GET` | `/api/v1/notifications` | User notifications |

---

## 📲 Building Native Mobile Apps

### Option A: React Native / Expo
1. Initialize a new Expo app:
   ```bash
   npx create-expo-app BehishebiMobile
   ```
2. Copy `mobile/HishabClient.ts` and `mobile/App.tsx` into your Expo project.
3. Start the app:
   ```bash
   npx expo start
   ```

### Option B: Turn Next.js into a Native App using Capacitor
You can also package this exact Next.js application into iOS and Android apps with 1 command:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Behishebi" "com.behishebi.app"
npx cap add ios
npx cap add android
npx cap sync
```

### Option C: PWA (Installable directly from browser)
This Next.js app has full PWA support with `manifest.json`. Users on iOS Safari can tap **"Add to Home Screen"** and Android Chrome users will get a native install prompt!

