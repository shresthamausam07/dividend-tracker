import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface StockFormProps {
  onStockAdded: () => void;
}

const StockForm: React.FC<StockFormProps> = ({ onStockAdded }) => {
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [shares, setShares] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker || !shares || !pricePerShare || !transactionDate) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/stocks/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          companyName: companyName || ticker.toUpperCase(),
          shares: parseFloat(shares),
          pricePerShare: parseFloat(pricePerShare),
          totalAmount: parseFloat(shares) * parseFloat(pricePerShare),
          transactionType,
          transactionDate,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        setTicker('');
        setCompanyName('');
        setShares('');
        setPricePerShare('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        // Call onStockAdded immediately to trigger refresh
        onStockAdded();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Stock Transaction</h2>
      
      <div className="transaction-toggle">
        <button
          type="button"
          className={`toggle-btn ${transactionType === 'BUY' ? 'active buy' : ''}`}
          onClick={() => setTransactionType('BUY')}
        >
          Buy
        </button>
        <button
          type="button"
          className={`toggle-btn ${transactionType === 'SELL' ? 'active sell' : ''}`}
          onClick={() => setTransactionType('SELL')}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="stock-form">
        <div className="form-group">
          <label htmlFor="ticker">Ticker Symbol *</label>
          <input
            id="ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g., AAPL"
            className="form-input"
            required
          />
        </div>
        
        {transactionType === 'BUY' && (
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Apple Inc."
              className="form-input"
            />
          </div>
        )}
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="transactionDate">Date *</label>
            <input
              id="transactionDate"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="shares">Shares *</label>
            <input
              id="shares"
              type="number"
              step="0.001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100.5"
              className="form-input"
              min="0.001"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pricePerShare">Price per Share *</label>
            <input
              id="pricePerShare"
              type="number"
              step="0.01"
              value={pricePerShare}
              onChange={(e) => setPricePerShare(e.target.value)}
              placeholder="150.00"
              className="form-input"
              min="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="totalAmount">Total Amount</label>
            <input
              id="totalAmount"
              type="text"
              value={shares && pricePerShare ? `$${(parseFloat(shares) * parseFloat(pricePerShare)).toFixed(2)}` : '$0.00'}
              className="form-input"
              disabled
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Split adjusted, Dividend reinvestment"
            className="form-input"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading 
            ? (transactionType === 'BUY' ? 'Buying...' : 'Selling...') 
            : (transactionType === 'BUY' ? 'Buy Stock' : 'Sell Stock')
          }
        </button>
      </form>
    </div>
  );
};

export default StockForm;