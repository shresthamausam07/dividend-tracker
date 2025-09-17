import React from 'react';
import { Stock } from '../types';

interface StockListProps {
  stocks: Stock[];
  loading: boolean;
}

const StockList: React.FC<StockListProps> = ({ stocks, loading }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="empty-state">
        <h3>No stocks in portfolio</h3>
        <p>Add your first stock purchase to get started</p>
      </div>
    );
  }

  return (
    <div className="stock-list-container">
      <h2 className="section-title">Portfolio Holdings</h2>
      <div className="stock-grid">
        {stocks.map((stock) => (
          <div key={stock.id} className="stock-card">
            <div className="stock-header">
              <div className="stock-ticker">{stock.ticker}</div>
              <div className="stock-company">{stock.company_name}</div>
            </div>
            
            <div className="stock-metrics">
              <div className="metric">
                <span className="metric-label">Shares</span>
                <span className="metric-value">{stock.total_shares.toLocaleString()}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Avg Cost</span>
                <span className="metric-value">${stock.average_price.toFixed(2)}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Current Price</span>
                <span className="metric-value">
                  ${stock.current_price?.toFixed(2) || stock.average_price.toFixed(2)}
                </span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Market Value</span>
                <span className="metric-value">
                  ${stock.current_value?.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  }) || (stock.total_shares * stock.average_price).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
              
              <div className="metric">
                <span className="metric-label">P&L</span>
                <span className={`metric-value ${
                  (stock.unrealized_gain_loss || 0) >= 0 ? 'gain' : 'loss'
                }`}>
                  {stock.unrealized_gain_loss !== undefined 
                    ? `${stock.unrealized_gain_loss >= 0 ? '+' : ''}$${stock.unrealized_gain_loss.toFixed(2)}`
                    : '$0.00'
                  }
                  {stock.unrealized_gain_loss_percent !== undefined && (
                    <span className="percentage">
                      ({stock.unrealized_gain_loss_percent >= 0 ? '+' : ''}{stock.unrealized_gain_loss_percent.toFixed(2)}%)
                    </span>
                  )}
                </span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Dividends</span>
                <span className="metric-value dividend-amount">
                  ${stock.total_dividends.toFixed(2)}
                  {stock.dividend_count > 0 && (
                    <span className="count">({stock.dividend_count})</span>
                  )}
                </span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Total Return</span>
                <span className={`metric-value ${
                  (stock.total_return || 0) >= 0 ? 'gain' : 'loss'
                }`}>
                  {stock.total_return !== undefined 
                    ? `${stock.total_return >= 0 ? '+' : ''}$${stock.total_return.toFixed(2)}`
                    : '$0.00'
                  }
                  {stock.total_return_percent !== undefined && (
                    <span className="percentage">
                      ({stock.total_return_percent >= 0 ? '+' : ''}{stock.total_return_percent.toFixed(2)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockList;