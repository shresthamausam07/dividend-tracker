import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import StockForm from './components/StockForm';
import StockList from './components/StockList';
import DividendForm from './components/DividendForm';
import DividendList from './components/DividendList';
import TransactionHistory from './components/TransactionHistory';
import { Stock, Dividend } from './types';

const DashboardContent: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'dividends'>('portfolio');
  const [loading, setLoading] = useState(false);
  const [transactionUpdateKey, setTransactionUpdateKey] = useState(0);
  const { user, logout, token } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:3001/api/stocks');
      const data = await response.json();
      if (response.ok) {
        setStocks(data);
      } else {
        console.error('Error fetching stocks:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDividends = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:3001/api/dividends');
      const data = await response.json();
      if (response.ok) {
        setDividends(data);
      } else {
        console.error('Error fetching dividends:', data.error);
      }
    } catch (error) {
      console.error('Error fetching dividends:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStocks();
      fetchDividends();
    }
  }, [token]);

  const handleStockAdded = () => {
    fetchStocks();
    // Also refresh dividends to update dividend counts on cards
    fetchDividends();
    // Trigger transaction history refresh
    setTransactionUpdateKey(prev => prev + 1);
  };

  const handleDividendAdded = () => {
    fetchDividends();
    // Also refresh stocks to update dividend data on cards
    fetchStocks();
  };

  const totalPortfolioValue = stocks.reduce((sum, stock) => sum + (stock.current_value || stock.total_shares * stock.average_price), 0);
  const totalCost = stocks.reduce((sum, stock) => sum + (stock.total_cost || stock.total_shares * stock.average_price), 0);
  const totalDividends = stocks.reduce((sum, stock) => sum + stock.total_dividends, 0);
  const totalUnrealizedGainLoss = stocks.reduce((sum, stock) => sum + (stock.unrealized_gain_loss || 0), 0);
  const totalRealizedGains = stocks.reduce((sum, stock) => sum + ((stock as any).total_realized_gains || 0), 0);
  const totalReturn = totalUnrealizedGainLoss + totalDividends + totalRealizedGains;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return (
    <div className="app">
      <div className="glass-container">
        <header className="header">
          <div className="header-top">
            <h1 className="app-title">DIVIDEND TRACKER</h1>
            <div className="user-info">
              <span className="welcome-text">Welcome, {user?.name}</span>
              <button onClick={logout} className="logout-btn">Sign Out</button>
            </div>
          </div>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-label">Portfolio Value</div>
              <div className="stat-value">${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Cost</div>
              <div className="stat-value">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">P&L</div>
              <div className={`stat-value ${totalUnrealizedGainLoss >= 0 ? 'gain' : 'loss'}`}>
                {totalUnrealizedGainLoss >= 0 ? '+' : ''}${totalUnrealizedGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Dividends</div>
              <div className="stat-value dividend-amount">${totalDividends.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Return</div>
              <div className={`stat-value ${totalReturn >= 0 ? 'gain' : 'loss'}`}>
                {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="percentage">({totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button 
            className={`nav-tab ${activeTab === 'dividends' ? 'active' : ''}`}
            onClick={() => setActiveTab('dividends')}
          >
            Dividends
          </button>
        </nav>

        <main className="main-content">
          {activeTab === 'portfolio' ? (
            <div className="portfolio-section">
              <StockForm onStockAdded={handleStockAdded} />
              <StockList stocks={stocks} loading={loading} />
              <TransactionHistory key={transactionUpdateKey} />
            </div>
          ) : (
            <div className="dividends-section">
              <DividendForm stocks={stocks} onDividendAdded={handleDividendAdded} />
              <DividendList dividends={dividends} key={dividends.length} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const AuthContent: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-app">
      {isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

const AppWrapper: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardContent /> : <AuthContent />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
};

export default App;