import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '@clerk/clerk-react';

export default function BankConnect({ onConnect, buttonText = "Connect Bank" }) {
  const { getToken } = useAuth();
  const [linkToken, setLinkToken] = useState(null);
  const [isExchanging, setIsExchanging] = useState(false);

  const fetchLinkToken = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/plaid/create_link_token', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({}) // Explicitly send an empty body
      });
      
      // Catch Nginx HTML proxy errors before they crash the JSON parser
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Link Token Error] Status: ${response.status} -`, errorText);
        return;
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Network or parsing error fetching link token:', error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const onSuccess = useCallback(async (public_token, metadata) => {
    setIsExchanging(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/plaid/exchange_public_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ public_token }),
      });
      
      const data = await response.json();
      if (data.success) {
        if (onConnect) onConnect();
        await fetchLinkToken();
      }
    } catch (error) {
      console.error('Error exchanging public token:', error);
    } finally {
      setIsExchanging(false);
    }
  }, [getToken, onConnect, fetchLinkToken]);

  const config = {
    token: linkToken,
    onSuccess,
  };
  const { open, ready } = usePlaidLink(config);

  return (
    <button 
      onClick={() => open()} 
      disabled={!ready || isExchanging}
      style={{
        padding: '8px 16px',
        backgroundColor: '#0a2540',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: (!ready || isExchanging) ? 'not-allowed' : 'pointer',
        fontWeight: '600'
      }}
    >
      {isExchanging ? 'Connecting...' : buttonText}
    </button>
  );
}