export default function TransactionTable({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <p>No transactions found for this period.</p>;
  }

  return (
    <div className="plaid-section" style={{ marginTop: '24px', background: 'transparent', boxShadow: 'none', padding: '0' }}>
      <h3 style={{ marginBottom: '16px', textAlign: 'left' }}>Recent Transactions</h3>
      <div className="transaction-list">
        {transactions.map((tx) => {
          // Plaid represents expenses as positive numbers and income as negative
          const isIncome = tx.amount < 0;
          const displayAmount = Math.abs(tx.amount).toFixed(2);

          return (
            <div key={tx.transaction_id} className="transaction-item">
              <div className="transaction-left">
                <span className="transaction-name">{tx.name}</span>
                <span className="transaction-details">
                  {tx.date} • {tx.category?.[0] || 'Uncategorized'}
                </span>
              </div>
              <div className={`transaction-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                {isIncome ? '+' : '-'}${displayAmount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}