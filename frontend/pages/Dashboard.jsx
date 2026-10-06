import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import BankConnect from '../components/BankConnect';
import SpendingPieChart from '../components/SpendingPieChart';
import MonthlyBarChart, { formatMonthName } from '../components/MonthlyBarChart';
import TransactionTable from '../components/TransactionTable';

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  // Removed the duplicate selectedAccountId declaration
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  const fetchTransactions = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/plaid/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setAccounts(data.accounts);
        setIsConnected(true);
      }
    } catch (err) {
      // Fails silently if user has not linked an account yet
      setIsConnected(false);
    }
  }, [getToken]);

  // Automatically check for an existing token when the dashboard mounts
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(tx => tx.date.substring(0, 7)));
    return Array.from(months).sort().reverse(); 
  }, [transactions]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const accountFilteredTransactions = useMemo(() => {
    if (selectedAccountId === 'all') return transactions;
    return transactions.filter(tx => tx.account_id === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const fullyFilteredTransactions = useMemo(() => {
    if (!selectedMonth) return accountFilteredTransactions;
    return accountFilteredTransactions.filter(tx => tx.date.startsWith(selectedMonth));
  }, [accountFilteredTransactions, selectedMonth]);

return (
    <div>
      <div className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2>Good morning,</h2>
          <div className="greeting" style={{ margin: 0 }}>{user?.firstName || 'User'}</div>
        </div>
        
        {/* This wrapper is the critical missing piece. It holds both the dropdown AND the button. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          {isConnected && (
            <select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)}
              style={{ padding: '6px', borderRadius: '8px', borderColor: 'transparent', background: 'rgba(255,255,255,0.2)', color: 'white', maxWidth: '200px' }}
            >
              <option value="all" style={{ color: 'black' }}>All Accounts</option>
              {accounts?.map(acc => (
                <option key={acc.account_id} value={acc.account_id} style={{ color: 'black' }}>
                  {acc.name} (..{acc.mask})
                </option>
              ))}
            </select>
          )}
          
          {/* Ensure BankConnect is  imported at the top of Dashboard.jsx */}
          <BankConnect onConnect={fetchTransactions} buttonText="Add Another Bank"  />
        </div>
      </div>
      
      {!isConnected ? (
         <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
           <p style={{ marginBottom: '16px' }}>Please connect your first bank to view your dashboard.</p>
           {/* Primary initial connection button */}
           <BankConnect onConnect={fetchTransactions} buttonText="Connect First Bank"  />
         </div>
      ) : (
         <div className="dashboard-grid">
           <div className="col-span-full">
             <MonthlyBarChart transactions={accountFilteredTransactions} />
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
               <h3 style={{ margin: 0 }}>Category Breakdown</h3>
               <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', borderColor: '#A7C4A0' }}
               >
                 {availableMonths.map(month => (
                   <option key={month} value={month}>{formatMonthName(month)}</option>
                 ))}
               </select>
             </div>
             <SpendingPieChart transactions={fullyFilteredTransactions} />
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <TransactionTable transactions={fullyFilteredTransactions} />
           </div>
         </div>
      )}
    </div>
  );
}