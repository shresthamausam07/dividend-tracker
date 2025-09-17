export interface Stock {
  id: number;
  ticker: string;
  company_name: string;
  total_shares: number;
  average_price: number;
  total_dividends: number;
  dividend_count: number;
  created_at: string;
  updated_at: string;
  // New P&L fields
  current_price?: number;
  current_value?: number;
  total_cost?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percent?: number;
  total_realized_gains?: number;
  total_return?: number;
  total_return_percent?: number;
}

export interface Dividend {
  id: number;
  ticker: string;
  shares_held: number;
  amount_per_share: number;
  total_amount: number;
  payment_date: string;
  record_date?: string;
  company_name: string;
  notes?: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  ticker: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_type: 'BUY' | 'SELL';
  transaction_date: string;
  realized_gain_loss?: number;
  notes?: string;
  created_at: string;
}