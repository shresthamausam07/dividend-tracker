import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';

interface TransactionHistoryProps {
  onTransactionUpdate?: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onTransactionUpdate }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [limit, setLimit] = useState(10);
  const { token } = useAuth();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTransactions(data);
        setFilteredTransactions(data.slice(0, limit));
      } else {
        console.error('Error fetching transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  // Refresh transactions when component remounts
  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, []);

  useEffect(() => {
    if (onTransactionUpdate) {
      fetchTransactions();
    }
  }, [onTransactionUpdate]);

  useEffect(() => {
    applyFilters();
  }, [transactions, startDate, endDate, selectedTicker, selectedType, limit]);

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date filter
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(endDate));
    }

    // Ticker filter
    if (selectedTicker) {
      filtered = filtered.filter(t => t.ticker.toLowerCase().includes(selectedTicker.toLowerCase()));
    }

    // Transaction type filter
    if (selectedType) {
      filtered = filtered.filter(t => t.transaction_type === selectedType);
    }

    // Apply limit
    filtered = filtered.slice(0, limit);

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedTicker('');
    setSelectedType('');
    setLimit(10);
  };

  const uniqueTickers = Array.from(new Set(transactions.map(t => t.ticker)));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading transaction history...</p>
      </div>
    );
  }

  return (
    <div className="transaction-history-container">
      <h3 className="section-title">Transaction History</h3>
      
      {/* Filters */}
      <div className="filters-container">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="startDate">From Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">To Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="tickerFilter">Ticker</label>
            <select
              id="tickerFilter"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="form-select filter-input"
            >
              <option value="">All Tickers</option>
              {uniqueTickers.map(ticker => (
                <option key={ticker} value={ticker}>{ticker}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="typeFilter">Type</label>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="form-select filter-input"
            >
              <option value="">All Types</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="limitFilter">Show</label>
            <select
              id="limitFilter"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="form-select filter-input"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={transactions.length}>All records</option>
            </select>
          </div>
          
          <div className="filter-group">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="transaction-table">
        <div className="table-header">
          <div className="header-cell">Date</div>
          <div className="header-cell">Ticker</div>
          <div className="header-cell">Type</div>
          <div className="header-cell">Shares</div>
          <div className="header-cell">Price</div>
          <div className="header-cell">Total</div>
          <div className="header-cell">Gain/Loss</div>
          <div className="header-cell">Notes</div>
        </div>
        
        <div className="table-body">
          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions found matching the selected filters.</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <div className="table-cell">{new Date(transaction.transaction_date).toLocaleDateString()}</div>
                <div className="table-cell ticker-cell">{transaction.ticker}</div>
                <div className={`table-cell ${transaction.transaction_type === 'BUY' ? 'gain' : 'loss'}`}>
                  {transaction.transaction_type}
                </div>
                <div className="table-cell">{transaction.shares.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                <div className="table-cell">${transaction.price_per_share.toFixed(2)}</div>
                <div className="table-cell">${transaction.total_amount.toFixed(2)}</div>
                <div className={`table-cell ${(transaction.realized_gain_loss || 0) >= 0 ? 'gain' : 'loss'}`}>
                  {transaction.transaction_type === 'SELL' && transaction.realized_gain_loss 
                    ? `${transaction.realized_gain_loss >= 0 ? '+' : ''}$${transaction.realized_gain_loss.toFixed(2)}`
                    : '-'
                  }
                </div>
                <div className="table-cell notes-cell">{transaction.notes || '-'}</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="table-summary">
        <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
      </div>
    </div>
  );
};

export default TransactionHistory;