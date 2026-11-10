# Hishab Rakhi (হিসাব রাখি) - Smart Financial Wallet & Expense Engine

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

**Hishab Rakhi** is a modern, high-performance financial wallet and expense tracking application. It transforms the mobile dashboard prototype into a **production-ready full-stack platform** featuring:
- **Responsive Web & Mobile App**: Pixel-perfect replication of your original prototype with sleek mobile container (430px) as well as an expanded wide-screen desktop view.
- **PWA (Progressive Web App)**: Installable directly onto iOS, Android, and Desktop home screens with native offline caching and app shell.
- **Dedicated REST API for Mobile Apps**: A separated `/api/v1/*` API designed for iOS, Android, React Native, and Flutter apps.
- **Interactive API Playground**: Built-in Swagger/Postman-like playground at `/api-docs` to test endpoints and copy mobile code snippets.
- **Mobile SDK & Starter**: Includes typed client `mobile/HishabClient.ts` and React Native starter `mobile/App.tsx`.

---

## 🌟 Key Features

### 1. Dashboard & Balance
- **Total Balance Display** with **Eye Toggle** (show/hide balance with `••••••••`).
- **Income & Expense Metrics** with dynamic trend badges (Red -3.1%, Green +4.2%).
- **Multi-currency Support**: Switch between `$ USD`, `৳ BDT`, `€ EUR`, `£ GBP`, `₹ INR`.

### 2. Actions & Modals
- **`+ Add Transaction`**: Modal with Expense/Income toggle, Category, Payee Title, Amount, Payment Account, and Date.
- **`Saving Goal`**: Create milestone goals with target amounts, initial savings, target dates, and progress calculation.
- **Quick Deposit**: Add funds directly into any savings goal from your checking or cash wallet.
- **Recent Activity**: Day grouping (`Today`, `Earlier`), category icons (Food, YouTube Red, Apple Dark, Freelance, Coffee), detail view modal, and transaction deletion.
- **See All Explorer**: Search by keyword, filter by Income/Expense, filter by Category pill, and date range.

### 3. Smart Receipt Scanner (OCR)
- Floating **`[📷 Scan]`** button.
- Receipt scanner modal with simulated OCR and presets (Starbucks, Target Supercenter, Uber Ride, Pharmacy).
- Automatic item recognition with 1-click **Confirm & Add to Wallet**.

### 4. 5 Full Bottom Navigation Tabs
1. **Home**: Full dashboard with balance, savings card, recent activity, and quick actions.
2. **Wallet**: Virtual credit/debit card carousel, linked accounts (Bank, Cash, Digital e-wallet), and account-to-account transfer modal.
3. **Analytics**: Monthly cash flow inflow vs outflow chart, category spending breakdown with percentage bars, and net savings rate.
4. **Statistics**: Monthly category budget meters with visual status badges (`Safe`, `Warning`, `Exceeded`) and budget editor.
5. **Profile**: User info, currency selector, CSV & JSON data export, reset data to prototype state, and Mobile API credentials.

---

## 📱 Dedicated Mobile App REST API (`/api/v1/...`)

The backend exposes clean, separated REST API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard` | One-shot dashboard summary (balance, trends, goals, recent tx, wallets) |
| `GET` | `/api/v1/transactions` | Query transactions (`?q=...&category=...&type=income&limit=20`) |
| `POST` | `/api/v1/transactions` | Create new transaction |
| `GET` | `/api/v1/transactions/:id` | Get transaction details |
| `PUT` | `/api/v1/transactions/:id` | Update transaction |
| `DELETE` | `/api/v1/transactions/:id` | Delete transaction |
| `GET` | `/api/v1/savings` | List savings goals |
| `POST` | `/api/v1/savings` | Create savings goal |
| `POST` | `/api/v1/savings/:id/deposit` | Deposit funds to savings goal |
| `DELETE` | `/api/v1/savings/:id` | Delete savings goal |
| `GET` | `/api/v1/wallets` | List bank accounts, cash wallets, cards |
| `POST` | `/api/v1/wallets` | Create new wallet account |
| `POST` | `/api/v1/wallets/transfer` | Transfer funds between accounts |
| `GET` | `/api/v1/analytics` | Category breakdown & monthly cashflow |
| `GET` | `/api/v1/budgets` | Category budget limits and usage percentage |
| `POST` | `/api/v1/budgets` | Set or update category budget |
| `POST` | `/api/v1/scan` | Smart receipt scanner endpoint |
| `GET` | `/api/v1/notifications` | Get notifications |
| `POST` | `/api/v1/notifications` | Mark read / clear notifications |
| `POST` | `/api/v1/auth/login` | Mobile auth endpoint returning Bearer token |
| `GET` | `/api/v1/auth/profile` | Get profile info |
| `PUT` | `/api/v1/auth/profile` | Update profile info & currency |
| `GET` | `/api/v1/data` | Export complete database JSON backup |
| `POST` | `/api/v1/data` | Reset to prototype default data or import JSON |

Visit **`/api-docs`** in your browser for the live interactive API playground!

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or pnpm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/Hishab_Rakhi.git
cd Hishab_Rakhi

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 How to Publish

### Option 1: Deploy to Vercel (Recommended - 1 Click)
1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Keep the default Next.js settings and click **Deploy**.
4. Your site and mobile REST API will be live instantly with global CDN and SSL!

### Option 2: Deploy with Docker (Railway / Render / Fly.io / VPS)
```bash
# Build the Docker container
docker build -t hishab-rakhi .

# Run the container
docker run -p 3000:3000 hishab-rakhi
```
Or run with Docker Compose:
```bash
docker-compose up -d
```

---

## 📲 Building the Native Mobile App (iOS & Android)

You have two powerful options:

### A. Using the included Mobile Client SDK (React Native / Expo)
1. Navigate to the `mobile/` directory:
   - `mobile/HishabClient.ts`: Typed API client ready to import.
   - `mobile/App.tsx`: Pre-built mobile dashboard component.
2. Initialize an Expo app:
   ```bash
   npx create-expo-app HishabMobile
   ```
3. Copy `mobile/HishabClient.ts` into your Expo app, set your published Next.js API domain, and build with `npx eas build`!

### B. Using Capacitor (Turn this Next.js app into native iOS/Android APK)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Hishab Rakhi" "com.hishabrakhi.app"
npx cap add ios
npx cap add android
npx cap sync
```

---

## 📄 License
MIT License. Free to use, customize, and publish for personal or commercial projects.

