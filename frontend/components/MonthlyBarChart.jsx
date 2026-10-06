import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush
} from 'recharts';

const COLORS = ['#1B5E4B', '#2E7D62', '#A7C4A0', '#374151', '#4b9b7d', '#718096', '#9ae6b4', '#1a202c'];

export const formatMonthName = (yyyy_mm) => {
  if (!yyyy_mm) return '';
  const [year, month] = yyyy_mm.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export default function MonthlyBarChart({ transactions }) {
  const [viewMode, setViewMode] = useState('bar'); 
  const [zoomIndexes, setZoomIndexes] = useState({ start: 0, end: 0 });
  const [initialTouchDistance, setInitialTouchDistance] = useState(null);
  
  const chartContainerRef = useRef(null);

  const { chartData, categories } = useMemo(() => {
    const dataByMonth = {};
    const uniqueCategories = new Set();
    
    transactions.forEach(tx => {
      if (tx.amount > 0) { 
        const month = tx.date.substring(0, 7);
        const category = tx.category?.[0] || 'Other';
        
        uniqueCategories.add(category);

        if (!dataByMonth[month]) {
          dataByMonth[month] = { month, formattedMonth: formatMonthName(month), total: 0 };
        }

        dataByMonth[month][category] = (dataByMonth[month][category] || 0) + tx.amount;
        dataByMonth[month].total += tx.amount;
      }
    });

    const sortedData = Object.values(dataByMonth).sort((a, b) => a.month.localeCompare(b.month));
    return { chartData: sortedData, categories: Array.from(uniqueCategories) };
  }, [transactions]);

  useEffect(() => {
    if (chartData.length > 0) {
      setZoomIndexes({ start: 0, end: chartData.length - 1 });
    }
  }, [chartData.length]);

  // Shared Zoom Logic
  const adjustZoom = useCallback((direction) => {
    if (chartData.length === 0) return;
    
    setZoomIndexes(prev => {
      let newStart = prev.start;
      let newEnd = prev.end;

      if (direction === 'in') {
        if (newEnd - newStart > 1) { 
          newStart += 1;
          newEnd -= 1;
        }
      } else {
        newStart = Math.max(0, prev.start - 1);
        newEnd = Math.min(chartData.length - 1, prev.end + 1);
      }
      return { start: newStart, end: newEnd };
    });
  }, [chartData.length]);

  // 1. Native Mouse Wheel Zoom (Scroll Lock)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e) => {
      e.preventDefault(); // Lock page scroll when hovering chart
      adjustZoom(e.deltaY < 0 ? 'in' : 'out');
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, [adjustZoom]);

  // 2. Touchscreen Pinch-to-Zoom Helper
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setInitialTouchDistance(getDistance(e.touches));
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialTouchDistance !== null) {
      if (e.cancelable) e.preventDefault(); 
      
      const currentDistance = getDistance(e.touches);
      const distanceDiff = currentDistance - initialTouchDistance;

      if (Math.abs(distanceDiff) > 15) {
        adjustZoom(distanceDiff > 0 ? 'in' : 'out');
        setInitialTouchDistance(currentDistance); 
      }
    }
  };

  const handleTouchEnd = () => {
    setInitialTouchDistance(null);
  };

  const visibleData = useMemo(() => {
    return chartData.slice(zoomIndexes.start, zoomIndexes.end + 1);
  }, [chartData, zoomIndexes]);

  if (!transactions.length) return null;

  return (
    <div className="plaid-section" style={{ height: '450px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, textAlign: 'left' }}>Monthly Spending Trend</h3>
        <button 
          onClick={() => setViewMode(viewMode === 'bar' ? 'line' : 'bar')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--accent-dark)', cursor: 'pointer', fontSize: '14px' }}
        >
          View {viewMode === 'bar' ? 'Total Line' : 'Category Bars'}
        </button>
      </div>

      <div 
        ref={chartContainerRef}
        style={{ flexGrow: 1, touchAction: 'none' }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={visibleData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="formattedMonth" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tickFormatter={(val) => `$${val}`} width={70} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              {categories.map((category, index) => (
                <Bar key={category} dataKey={category} stackId="a" fill={COLORS[index % COLORS.length]} />
              ))}
              <Brush dataKey="formattedMonth" height={30} stroke="#1B5E4B" />
            </BarChart>
          ) : (
            <LineChart data={visibleData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="formattedMonth" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tickFormatter={(val) => `$${val}`} width={70} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#1B5E4B" strokeWidth={3} dot={{ r: 4, fill: '#1B5E4B' }} activeDot={{ r: 6 }} />
              <Brush dataKey="formattedMonth" height={30} stroke="#1B5E4B" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}