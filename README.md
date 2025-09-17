# Dividend Tracker

A modern, futuristic dividend tracking application built with React and Node.js.

## Features

- 📊 **Portfolio Management**: Track your stock purchases with automatic share aggregation
- 💰 **Dividend Tracking**: Record and monitor dividend payments
- 🎨 **Futuristic UI**: Glass morphism design with transparent elements
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Real-time Updates**: Instant portfolio and dividend calculations

## Key Functionality

- **Unique Ticker Management**: When you buy more shares of an existing stock, the system automatically:
  - Combines your share count
  - Calculates your new average purchase price
  - Shows the stock as a single entry
- **Dividend Calculation**: Automatically calculates total dividend payments based on your current share holdings
- **Transaction History**: Keeps track of all your buy transactions
- **Portfolio Metrics**: Real-time portfolio value and total dividends received

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Styling**: CSS with glass morphism effects

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm run install-deps
   ```

### Running the Application

1. Start both the server and client:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Usage

#### Adding Stock Purchases

1. Go to the "Portfolio" tab
2. Fill in the stock form:
   - **Ticker Symbol**: Stock symbol (e.g., AAPL, MSFT)
   - **Company Name**: Optional company name
   - **Shares**: Number of shares purchased
   - **Price per Share**: Purchase price per share
3. Click "Add Stock"

If you already own the stock, the system will:
- Add the new shares to your existing position
- Recalculate your average cost basis
- Update the total value

#### Recording Dividends

1. Go to the "Dividends" tab
2. Fill in the dividend form:
   - **Stock Ticker**: Select from your portfolio
   - **Amount per Share**: Dividend amount per share
   - **Payment Date**: When the dividend was paid
   - **Ex-Dividend Date**: Optional
   - **Record Date**: Optional
3. Click "Record Dividend"

The system automatically calculates the total dividend based on your current share count.

## Project Structure

```
dividend-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── App.tsx         # Main app component
│   │   └── App.css         # Futuristic styling
├── server/                 # Node.js backend
│   ├── database.js         # SQLite database setup
│   ├── index.js           # Express server
│   └── package.json
└── package.json           # Root package file
```

## API Endpoints

- `GET /api/stocks` - Get all stocks with dividend summaries
- `POST /api/stocks/buy` - Add a stock purchase
- `GET /api/dividends/:ticker?` - Get dividend history
- `POST /api/dividends` - Record a dividend payment
- `GET /api/transactions/:ticker?` - Get transaction history

## Database Schema

### Stocks Table
- Stores unique stock positions with aggregated share counts and average prices

### Transactions Table
- Records all individual buy/sell transactions

### Dividends Table
- Tracks all dividend payments with dates and amounts

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License