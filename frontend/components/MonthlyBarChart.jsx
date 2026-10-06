import { useMemo, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// Extended color palette for multiple categories
const COLORS = ['#1B5E4B', '#2E7D62', '#A7C4A0', '#374151', '#4b9b7d', '#718096', '#9ae6b4', '#1a202c'];

export const formatMonthName = (yyyy_mm) => {
  if (!yyyy_mm) return '';
  const [year, month] = yyyy_mm.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export default function MonthlyBarChart({ transactions }) {
  const [viewMode, setViewMode] = useState('bar'); // 'bar' or 'line'

  const { chartData, categories } = useMemo(() => {
    const dataByMonth = {};
    const uniqueCategories = new Set();
    
    transactions.forEach(tx => {
      if (tx.amount > 0) { // Expenses only
        const month = tx.date.substring(0, 7);
        const category = tx.category?.[0] || 'Other';
        
        uniqueCategories.add(category);

        if (!dataByMonth[month]) {
          dataByMonth[month] = { 
            month, 
            formattedMonth: formatMonthName(month), 
            total: 0 
          };
        }

        // Add to the specific category sum
        dataByMonth[month][category] = (dataByMonth[month][category] || 0) + tx.amount;
        // Add to the overall monthly total
        dataByMonth[month].total += tx.amount;
      }
    });

    // Convert object to array and sort chronologically
    const sortedData = Object.values(dataByMonth).sort((a, b) => a.month.localeCompare(b.month));
    
    return { 
      chartData: sortedData, 
      categories: Array.from(uniqueCategories) 
    };
  }, [transactions]);

  if (!transactions.length) return null;

  return (
    <div className="plaid-section" style={{ height: '450px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Toggle Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, textAlign: 'left' }}>Monthly Spending Trend</h3>
        
        <button 
          onClick={() => setViewMode(viewMode === 'bar' ? 'line' : 'bar')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--white)',
            color: 'var(--accent-dark)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          View {viewMode === 'bar' ? 'Total Line' : 'Category Bars'}
        </button>
      </div>

      {/* Chart Area */}
      <div style={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="formattedMonth" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tickFormatter={(val) => `$${val}`} width={70} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              
              {/* Dynamically render a stacked bar for every category */}
              {categories.map((category, index) => (
                <Bar 
                  key={category} 
                  dataKey={category} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="formattedMonth" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tickFormatter={(val) => `$${val}`} width={70} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              
              {/* Render a single line for the total sum */}
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Total Spending"
                stroke="#1B5E4B" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#1B5E4B' }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}