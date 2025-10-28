/**
 * Balance Calculator Utility
 * 
 * Calculates total balances across accounts with multi-currency support.
 * 
 * Story 2.2:
 * AC7: Total Calculation - Displays total balance across all accounts
 * AC8: Multi-Currency Handling - Shows subtotals per currency
 * 
 * Note: Currency conversion is not implemented yet (future enhancement).
 * For now, we group by currency and show subtotals.
 */

/**
 * Account data structure for balance calculation
 */
export interface AccountBalance {
  balance: number;
  currency: string;
}

/**
 * Multi-currency balance result
 */
export interface BalanceResult {
  totalByCurrency: Record<string, number>;
  primaryCurrencyTotal?: number;
  primaryCurrency?: string;
  hasMixedCurrencies: boolean;
}

/**
 * Calculate total balance across accounts
 * 
 * Groups balances by currency and calculates subtotals.
 * If all accounts use the same currency, returns a simple total.
 * If mixed currencies, returns subtotals per currency.
 * 
 * @param accounts - Array of accounts with balance and currency
 * @param primaryCurrency - User's primary currency preference
 * @returns Balance result with totals per currency
 * 
 * Examples:
 * - All EGP accounts → { totalByCurrency: { EGP: 5000 }, hasMixedCurrencies: false }
 * - Mixed currencies → { totalByCurrency: { EGP: 5000, USD: 100 }, hasMixedCurrencies: true }
 */
export function calculateTotalBalance(
  accounts: AccountBalance[],
  primaryCurrency: string = "EGP"
): BalanceResult {
  // Group balances by currency
  const totalByCurrency: Record<string, number> = {};

  for (const account of accounts) {
    const { balance, currency } = account;
    
    if (!totalByCurrency[currency]) {
      totalByCurrency[currency] = 0;
    }
    
    totalByCurrency[currency] += balance;
  }

  // Check if we have mixed currencies
  const currencies = Object.keys(totalByCurrency);
  const hasMixedCurrencies = currencies.length > 1;

  // If single currency or primary currency exists, set it
  const primaryCurrencyTotal = totalByCurrency[primaryCurrency];

  return {
    totalByCurrency,
    primaryCurrencyTotal,
    primaryCurrency,
    hasMixedCurrencies,
  };
}

/**
 * Format balance with thousands separator
 * 
 * @param balance - Balance to format
 * @returns Formatted balance string (e.g., "1,000.00")
 * 
 * Examples:
 * - 1000 → "1,000.00"
 * - 1234567.89 → "1,234,567.89"
 * - 0 → "0.00"
 */
export function formatBalance(balance: number): string {
  return balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
