import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#1B5E4B', '#2E7D62', '#A7C4A0', '#374151', '#4b9b7d', '#718096'];

export default function SpendingPieChart({ transactions }) {
  const categoryData = useMemo(() => {
    const totals = {};
    
    transactions.forEach(tx => {
      if (tx.amount > 0) { 
        const category = tx.category?.[0] || 'Other';
        totals[category] = (totals[category] || 0) + tx.amount;
      }
    });

    return Object.keys(totals)
      .map(name => ({ name, value: totals[name] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="plaid-section">
        <p>No recent transactions found.</p>
      </div>
    );
  }

  return (
    <div className="plaid-section" style={{ height: '480px', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
      <h3 style={{ marginBottom: '16px', textAlign: 'left' }}>Spending Breakdown</h3>
      <div style={{ flexGrow: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={categoryData} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="45%" 
              innerRadius={45} 
              outerRadius={75} 
              label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
              labelLine={true}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend 
              layout="horizontal" 
              align="center" 
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}