import React, { useState, useEffect } from 'react';
import { Dividend } from '../types';

interface DividendListProps {
  dividends: Dividend[];
}

const DividendList: React.FC<DividendListProps> = ({ dividends }) => {
  const [filteredDividends, setFilteredDividends] = useState<Dividend[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    applyFilters();
  }, [dividends, startDate, endDate, selectedTicker, limit]);

  const applyFilters = () => {
    let filtered = [...dividends];

    // Date filter
    if (startDate) {
      filtered = filtered.filter(d => new Date(d.payment_date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(d => new Date(d.payment_date) <= new Date(endDate));
    }

    // Ticker filter
    if (selectedTicker) {
      filtered = filtered.filter(d => d.ticker.toLowerCase().includes(selectedTicker.toLowerCase()));
    }

    // Apply limit
    filtered = filtered.slice(0, limit);

    setFilteredDividends(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedTicker('');
    setLimit(10);
  };

  const uniqueTickers = Array.from(new Set(dividends.map(d => d.ticker)));

  if (dividends.length === 0) {
    return (
      <div className="empty-state">
        <h3>No dividend payments recorded</h3>
        <p>Record your first dividend payment to get started</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dividend-list-container">
      <h2 className="section-title">Dividend History</h2>
      
      {/* Filters */}
      <div className="filters-container">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="dividendStartDate">From Date</label>
            <input
              id="dividendStartDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="dividendEndDate">To Date</label>
            <input
              id="dividendEndDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="dividendTickerFilter">Ticker</label>
            <select
              id="dividendTickerFilter"
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
            <label htmlFor="dividendLimitFilter">Show</label>
            <select
              id="dividendLimitFilter"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="form-select filter-input"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={dividends.length}>All records</option>
            </select>
          </div>
          
          <div className="filter-group">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      <div className="dividend-table">
        <div className="table-header">
          <div className="header-cell">Ticker</div>
          <div className="header-cell">Company</div>
          <div className="header-cell">Shares Held</div>
          <div className="header-cell">Per Share</div>
          <div className="header-cell">Total Amount</div>
          <div className="header-cell">Payment Date</div>
          <div className="header-cell">Notes</div>
        </div>
        
        <div className="table-body">
          {filteredDividends.length === 0 ? (
            <div className="empty-state">
              <p>No dividends found matching the selected filters.</p>
            </div>
          ) : (
            filteredDividends.map((dividend) => (
              <div key={dividend.id} className="table-row">
                <div className="table-cell ticker-cell">{dividend.ticker}</div>
                <div className="table-cell company-cell">{dividend.company_name}</div>
                <div className="table-cell">{dividend.shares_held?.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || 'N/A'}</div>
                <div className="table-cell amount-cell">${dividend.amount_per_share.toFixed(4)}</div>
                <div className="table-cell total-cell">${dividend.total_amount.toFixed(2)}</div>
                <div className="table-cell date-cell">{formatDate(dividend.payment_date)}</div>
                <div className="table-cell notes-cell">{dividend.notes || '-'}</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="table-summary">
        <span>Showing {filteredDividends.length} of {dividends.length} dividend payments</span>
      </div>
      
      <div className="dividend-summary">
        <div className="summary-stat">
          <span className="summary-label">Filtered Payments:</span>
          <span className="summary-value">{filteredDividends.length}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Filtered Total:</span>
          <span className="summary-value">
            ${filteredDividends.reduce((sum, d) => sum + d.total_amount, 0).toFixed(2)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">All Time Total:</span>
          <span className="summary-value">
            ${dividends.reduce((sum, d) => sum + d.total_amount, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DividendList;