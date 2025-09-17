const axios = require('axios');

// Alpha Vantage free API key (500 calls per day, 5 calls per minute)
const ALPHA_VANTAGE_API_KEY = 'RIBXT3XEYLB4G28H'; // Free API key
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Financial Modeling Prep as backup
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Cache to avoid hitting API limits
const priceCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes - longer cache for better performance

// Pre-populate cache with some popular stocks for faster initial loading
const initializePopularStocks = () => {
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
  
  // Only fetch if cache is empty (avoid on every restart)
  if (priceCache.size === 0) {
    setTimeout(async () => {
      for (let i = 0; i < Math.min(3, popularStocks.length); i++) {
        try {
          await getStockPrice(popularStocks[i]);
          // Small delay between calls
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log(`Failed to pre-cache ${popularStocks[i]}`);
        }
      }
    }, 5000); // Start after 5 seconds to not delay server startup
  }
};

// Initialize popular stocks cache
initializePopularStocks();

const getStockPrice = async (symbol) => {
  try {
    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    // Try Alpha Vantage free API first
    try {
      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: ALPHA_VANTAGE_API_KEY
        },
        timeout: 10000
      });

      if (response.data && response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
        const price = parseFloat(response.data['Global Quote']['05. price']);
        if (price > 0) {
          priceCache.set(symbol, { price, timestamp: Date.now() });
          console.log(`Got real Alpha Vantage price for ${symbol}: $${price}`);
          return price;
        }
      } else if (response.data && response.data['Error Message']) {
        console.log(`Alpha Vantage error for ${symbol}: ${response.data['Error Message']}`);
      } else if (response.data && response.data['Note']) {
        console.log(`Alpha Vantage rate limit for ${symbol}: ${response.data['Note']}`);
      }
    } catch (error) {
      console.log(`Alpha Vantage API error for ${symbol}:`, error.message);
    }

    // Fallback: Try Financial Modeling Prep (free tier)
    try {
      const response = await axios.get(`${FMP_BASE_URL}/quote-short/${symbol.toUpperCase()}`, {
        timeout: 8000
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].price > 0) {
        const price = response.data[0].price;
        priceCache.set(symbol, { price, timestamp: Date.now() });
        console.log(`Got real price for ${symbol}: $${price}`);
        return price;
      }
    } catch (error) {
      console.log(`FMP API error for ${symbol}:`, error.message);
    }

    // Final fallback to simulated prices
    console.log(`Using simulated price for ${symbol} (real APIs failed)`);
    const simulatedPrice = generateSimulatedPrice(symbol);
    priceCache.set(symbol, { price: simulatedPrice, timestamp: Date.now() });
    return simulatedPrice;

  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    return generateSimulatedPrice(symbol);
  }
};

// Generate realistic simulated prices for demo purposes
const generateSimulatedPrice = (symbol) => {
  // Popular stock approximate prices (as of 2024/2025)
  const popularStocks = {
    'AAPL': 185.00,
    'MSFT': 380.00,
    'GOOGL': 140.00,
    'GOOG': 140.00,
    'AMZN': 155.00,
    'TSLA': 200.00,
    'META': 340.00,
    'NVDA': 450.00,
    'NFLX': 400.00,
    'AMD': 110.00,
    'INTC': 40.00,
    'BABA': 80.00,
    'UBER': 60.00,
    'ABNB': 130.00,
    'COIN': 180.00,
    'SQ': 70.00,
    'PYPL': 60.00,
    'ROKU': 50.00,
    'ZOOM': 70.00,
    'CRM': 250.00,
    'ADBE': 550.00,
    'ORCL': 110.00,
    'IBM': 180.00,
    'V': 260.00,
    'MA': 420.00,
    'JPM': 160.00,
    'BAC': 35.00,
    'WFC': 45.00,
    'GS': 380.00,
    'MS': 90.00,
    'C': 55.00,
    'KO': 60.00,
    'PEP': 180.00,
    'WMT': 160.00,
    'HD': 350.00,
    'DIS': 110.00,
    'MCD': 280.00,
    'NKE': 90.00,
    'SBUX': 95.00
  };

  const upperSymbol = symbol.toUpperCase();
  
  if (popularStocks[upperSymbol]) {
    // Add some daily variation (±3%) to the base price
    const basePrice = popularStocks[upperSymbol];
    const variation = (Math.random() - 0.5) * 0.06; // ±3%
    const currentPrice = basePrice * (1 + variation);
    return Math.round(currentPrice * 100) / 100;
  }
  
  // For unknown stocks, generate consistent price based on symbol
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate base price between $5-300 based on symbol
  const basePrice = Math.abs(hash % 295) + 5;
  
  // Add some daily variation (±3%)
  const variation = (Math.random() - 0.5) * 0.06;
  const currentPrice = basePrice * (1 + variation);
  
  return Math.round(currentPrice * 100) / 100;
};

const getMultipleStockPrices = async (symbols) => {
  const prices = {};
  
  // Check cache first for all symbols
  const uncachedSymbols = [];
  for (let symbol of symbols) {
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      prices[symbol] = cached.price;
    } else {
      uncachedSymbols.push(symbol);
    }
  }
  
  // If all prices are cached, return immediately
  if (uncachedSymbols.length === 0) {
    return prices;
  }
  
  // For uncached symbols, fetch in parallel with shorter delays
  const promises = uncachedSymbols.map(async (symbol, index) => {
    // Stagger requests by 2 seconds to stay within rate limits
    await new Promise(resolve => setTimeout(resolve, index * 2000));
    
    try {
      const price = await getStockPrice(symbol);
      return { symbol, price };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return { symbol, price: generateSimulatedPrice(symbol) };
    }
  });
  
  const results = await Promise.all(promises);
  results.forEach(({ symbol, price }) => {
    prices[symbol] = price;
  });
  
  return prices;
};

module.exports = {
  getStockPrice,
  getMultipleStockPrices
};