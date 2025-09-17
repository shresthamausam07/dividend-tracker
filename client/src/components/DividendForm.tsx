import React, { useState } from 'react';
import { Stock } from '../types';
import { useAuth } from '../context/AuthContext';

interface DividendFormProps {
  stocks: Stock[];
  onDividendAdded: () => void;
}

const DividendForm: React.FC<DividendFormProps> = ({ stocks, onDividendAdded }) => {
  const [ticker, setTicker] = useState('');
  const [sharesHeld, setSharesHeld] = useState('');
  const [amountPerShare, setAmountPerShare] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker || !sharesHeld || !amountPerShare || !paymentDate) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/dividends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticker,
          sharesHeld: parseFloat(sharesHeld),
          amountPerShare: parseFloat(amountPerShare),
          paymentDate,
          recordDate: recordDate || null,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        setTicker('');
        setSharesHeld('');
        setAmountPerShare('');
        setPaymentDate('');
        setRecordDate('');
        setNotes('');
        // Call onDividendAdded immediately to trigger refresh
        onDividendAdded();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding dividend:', error);
      alert('Failed to add dividend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Record Dividend Payment</h2>
      <form onSubmit={handleSubmit} className="dividend-form">
        <div className="form-group">
          <label htmlFor="ticker">Stock Ticker *</label>
          <select
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Select a stock</option>
            {stocks.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>
                {stock.ticker} - {stock.company_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sharesHeld">Shares Held on Record Date *</label>
            <input
              id="sharesHeld"
              type="number"
              step="0.001"
              value={sharesHeld}
              onChange={(e) => setSharesHeld(e.target.value)}
              placeholder="100.5"
              className="form-input"
              min="0.001"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amountPerShare">Amount per Share *</label>
            <input
              id="amountPerShare"
              type="number"
              step="0.0001"
              value={amountPerShare}
              onChange={(e) => setAmountPerShare(e.target.value)}
              placeholder="0.5000"
              className="form-input"
              min="0.0001"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date *</label>
            <input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recordDate">Record Date</label>
            <input
              id="recordDate"
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="form-input"
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
            placeholder="e.g., Special dividend, DRIP"
            className="form-input"
          />
        </div>
        
        {sharesHeld && amountPerShare && (
          <div className="dividend-preview">
            <span>Total dividend: </span>
            <strong>
              ${(parseFloat(sharesHeld || '0') * parseFloat(amountPerShare || '0')).toFixed(2)}
            </strong>
          </div>
        )}
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Recording...' : 'Record Dividend'}
        </button>
      </form>
    </div>
  );
};

export default DividendForm;