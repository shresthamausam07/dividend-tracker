const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { authenticateToken, JWT_SECRET } = require('./middleware/auth');
const { getMultipleStockPrices } = require('./services/stockPrice');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Auth Routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        const token = jwt.sign(
          { userId: this.lastID, email, name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.status(201).json({
          message: 'User created successfully',
          token,
          user: { id: this.lastID, email, name }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Protected Routes - All routes below require authentication
app.use(authenticateToken);

app.get('/api/stocks', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get stock data from database including realized gains
    const stocks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.*,
          COALESCE(SUM(d.total_amount), 0) as total_dividends,
          COUNT(d.id) as dividend_count,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'SELL' THEN t.realized_gain_loss ELSE 0 END), 0) as total_realized_gains
        FROM stocks s
        LEFT JOIN dividends d ON s.ticker = d.ticker AND s.user_id = d.user_id
        LEFT JOIN transactions t ON s.ticker = t.ticker AND s.user_id = t.user_id
        WHERE s.user_id = ?
        GROUP BY s.id, s.ticker
        ORDER BY s.ticker
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (stocks.length === 0) {
      return res.json([]);
    }

    // Get current prices for all stocks
    const symbols = stocks.map(stock => stock.ticker);
    const currentPrices = await getMultipleStockPrices(symbols);

    // Calculate P&L and add current prices
    const stocksWithPrices = stocks.map(stock => {
      const currentPrice = currentPrices[stock.ticker] || stock.average_price;
      const totalCost = stock.total_shares * stock.average_price;
      const currentValue = stock.total_shares * currentPrice;
      const unrealizedGainLoss = currentValue - totalCost;
      const unrealizedGainLossPercent = totalCost > 0 ? (unrealizedGainLoss / totalCost) * 100 : 0;

      return {
        ...stock,
        current_price: currentPrice,
        current_value: currentValue,
        total_cost: totalCost,
        unrealized_gain_loss: unrealizedGainLoss,
        unrealized_gain_loss_percent: unrealizedGainLossPercent,
        total_return: unrealizedGainLoss + stock.total_dividends + stock.total_realized_gains,
        total_return_percent: totalCost > 0 ? ((unrealizedGainLoss + stock.total_dividends + stock.total_realized_gains) / totalCost) * 100 : 0
      };
    });

    res.json(stocksWithPrices);
  } catch (error) {
    console.error('Error fetching stocks with prices:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.post('/api/stocks/transaction', (req, res) => {
  const { ticker, shares, pricePerShare, totalAmount, companyName, transactionType, transactionDate, notes } = req.body;
  const userId = req.user.userId;
  
  if (!ticker || !shares || !pricePerShare || !transactionType || !transactionDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['BUY', 'SELL'].includes(transactionType)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  db.serialize(() => {
    db.get('SELECT * FROM stocks WHERE ticker = ? AND user_id = ?', [ticker, userId], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (transactionType === 'BUY') {
        if (row) {
          // Update existing stock with fractional share support
          const newTotalShares = parseFloat(row.total_shares) + parseFloat(shares);
          const newTotalValue = (parseFloat(row.total_shares) * parseFloat(row.average_price)) + (parseFloat(shares) * parseFloat(pricePerShare));
          const newAveragePrice = newTotalValue / newTotalShares;

          db.run(`
            UPDATE stocks 
            SET total_shares = ?, average_price = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ticker = ? AND user_id = ?
          `, [newTotalShares, newAveragePrice, ticker, userId], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            db.run(`
              INSERT INTO transactions (user_id, ticker, shares, price_per_share, total_amount, transaction_type, transaction_date, realized_gain_loss, notes)
              VALUES (?, ?, ?, ?, ?, 'BUY', ?, ?, ?)
            `, [userId, ticker, shares, pricePerShare, totalAmount, transactionDate, 0, notes]);
            
            res.json({ message: 'Stock updated successfully' });
          });
        } else {
          // Create new stock
          db.run(`
            INSERT INTO stocks (user_id, ticker, company_name, total_shares, average_price)
            VALUES (?, ?, ?, ?, ?)
          `, [userId, ticker, companyName || ticker, shares, pricePerShare], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            db.run(`
              INSERT INTO transactions (user_id, ticker, shares, price_per_share, total_amount, transaction_type, transaction_date, realized_gain_loss, notes)
              VALUES (?, ?, ?, ?, ?, 'BUY', ?, ?, ?)
            `, [userId, ticker, shares, pricePerShare, totalAmount, transactionDate, 0, notes]);
            
            res.json({ message: 'Stock added successfully' });
          });
        }
      } else if (transactionType === 'SELL') {
        if (!row) {
          return res.status(404).json({ error: 'Stock not found' });
        }

        if (parseFloat(row.total_shares) < parseFloat(shares)) {
          return res.status(400).json({ error: 'Cannot sell more shares than you own' });
        }

        const newTotalShares = parseFloat(row.total_shares) - parseFloat(shares);
        // Calculate realized gain/loss: (sell price - average cost) * shares sold
        const realizedGainLoss = (parseFloat(pricePerShare) - parseFloat(row.average_price)) * parseFloat(shares);

        if (newTotalShares <= 0.001) { // Handle very small fractional remainders
          // Remove stock completely
          db.run(`
            DELETE FROM stocks WHERE ticker = ? AND user_id = ?
          `, [ticker, userId], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            db.run(`
              INSERT INTO transactions (user_id, ticker, shares, price_per_share, total_amount, transaction_type, transaction_date, realized_gain_loss, notes)
              VALUES (?, ?, ?, ?, ?, 'SELL', ?, ?, ?)
            `, [userId, ticker, shares, pricePerShare, totalAmount, transactionDate, realizedGainLoss, notes]);
            
            res.json({ message: 'Stock sold completely' });
          });
        } else {
          // Update stock with remaining shares
          db.run(`
            UPDATE stocks 
            SET total_shares = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ticker = ? AND user_id = ?
          `, [newTotalShares, ticker, userId], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            db.run(`
              INSERT INTO transactions (user_id, ticker, shares, price_per_share, total_amount, transaction_type, transaction_date, realized_gain_loss, notes)
              VALUES (?, ?, ?, ?, ?, 'SELL', ?, ?, ?)
            `, [userId, ticker, shares, pricePerShare, totalAmount, transactionDate, realizedGainLoss, notes]);
            
            res.json({ message: 'Stock sold successfully' });
          });
        }
      }
    });
  });
});

app.post('/api/dividends', (req, res) => {
  const { ticker, sharesHeld, amountPerShare, paymentDate, recordDate, notes } = req.body;
  const userId = req.user.userId;
  
  if (!ticker || !sharesHeld || !amountPerShare || !paymentDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const totalAmount = sharesHeld * amountPerShare;

  db.run(`
    INSERT INTO dividends (user_id, ticker, shares_held, amount_per_share, total_amount, payment_date, record_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, ticker, sharesHeld, amountPerShare, totalAmount, paymentDate, recordDate, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Dividend added successfully', id: this.lastID });
  });
});

app.get('/api/dividends/:ticker?', (req, res) => {
  const { ticker } = req.params;
  const userId = req.user.userId;
  let query = `
    SELECT d.*, s.company_name 
    FROM dividends d
    JOIN stocks s ON d.ticker = s.ticker AND d.user_id = s.user_id
    WHERE d.user_id = ?
  `;
  let params = [userId];
  
  if (ticker) {
    query += ' AND d.ticker = ?';
    params.push(ticker);
  }
  
  query += ' ORDER BY d.payment_date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/transactions/:ticker?', (req, res) => {
  const { ticker } = req.params;
  const userId = req.user.userId;
  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  let params = [userId];
  
  if (ticker) {
    query += ' AND ticker = ?';
    params.push(ticker);
  }
  
  query += ' ORDER BY transaction_date DESC, created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// New endpoint for all transactions without ticker filter
app.get('/api/transactions', (req, res) => {
  const userId = req.user.userId;
  
  db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC', [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});