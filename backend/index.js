
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const app = express();

// 1. Security & Core Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(clerkMiddleware());

// 2. Initialize Plaid
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);




// 3. Routes

app.post('/api/plaid/exchange_public_token', async (req, res, next) => {
  try {
    // Correctly get the userId using the imported Clerk function
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { public_token } = req.body;

    // 1. Exchange the public token for an access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });
    const accessToken = exchangeResponse.data.access_token;

    // 2. Fetch the user's existing metadata from Clerk
    const user = await clerkClient.users.getUser(userId);
    const existingTokens = user.privateMetadata.plaidAccessTokens || [];

    // 3. Append the new token, preventing duplicates just in case
    const updatedTokens = [...new Set([...existingTokens, accessToken])];

    // 4. Save the full array back to Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { 
        plaidAccessTokens: updatedTokens 
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});
app.post('/api/plaid/debug/clear_all', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await clerkClient.users.getUser(userId);
    const accessTokens = user.privateMetadata?.plaidAccessTokens || [];

    // 1. Delete each duplicate connection from Plaid's servers to restore your limits
    for (const token of accessTokens) {
      try {
        await plaidClient.itemRemove({ access_token: token });
      } catch (err) {
        console.error('Plaid deletion skipped for token (may already be deleted):', err.message);
      }
    }

    // 2. Wipe the tokens from your Clerk database so your dashboard is truly empty
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { plaidAccessTokens: [] }
    });

    res.json({ success: true, message: 'All banks disconnected and limits restored.' });
  } catch (error) {
    next(error);
  }
});


app.get('/api/plaid/transactions', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await clerkClient.users.getUser(userId);
    let accessTokens = user.privateMetadata?.plaidAccessTokens || [];
    
    // Read fallback
    if (user.privateMetadata?.plaidAccessToken && !accessTokens.includes(user.privateMetadata.plaidAccessToken)) {
      accessTokens.push(user.privateMetadata.plaidAccessToken);
    }
    
    if (accessTokens.length === 0) {
      // Return 200 OK instead of 400, because 0 banks is a normal user state
      return res.json({ 
        success: false,
        transactions: [],
        accounts: [],
        message: 'No active bank connections found for this user.' 
      });
    }

   
    // Map all tokens to promises
    const bankDataPromises = accessTokens.map(async (token) => {
      let cursor = null;
      let allAdded = [];
      let hasMore = true;

      // Loop to fetch all historical transaction pages
      while (hasMore) {
        const syncResponse = await plaidClient.transactionsSync({ 
          access_token: token,
          cursor: cursor
        });
        
        allAdded = allAdded.concat(syncResponse.data.added);
        hasMore = syncResponse.data.has_more;
        cursor = syncResponse.data.next_cursor;
      }

      const accountsResponse = await plaidClient.accountsGet({ access_token: token });
      
      return {
        transactions: allAdded,
        accounts: accountsResponse.data.accounts
      };
    });

    // Handle multiple banks gracefully
    const results = await Promise.allSettled(bankDataPromises);
    
    let allTransactions = [];
    let allAccounts = [];
    let itemsNeedingUpdate = [];

    
    results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    allTransactions.push(...result.value.transactions);
    allAccounts.push(...result.value.accounts);
  } else {
    const errorData = result.reason.response?.data;
    
    // 3. Catch the specific Plaid login error
    if (errorData?.error_code === 'ITEM_LOGIN_REQUIRED') {
      itemsNeedingUpdate.push(index);
    }
    console.error(`[Bank Sync Error - Index ${index}]:`, errorData || result.reason.message);
  }
});

// --- NEW: Save to JSON File ---
    try {
      const backupData = {
        last_synced: new Date().toISOString(),
        total_accounts: allAccounts.length,
        total_transactions: allTransactions.length,
        accounts: allAccounts,
        transactions: allTransactions
      };
      
      // Writes to a file named 'transactions_backup.json' in your backend root directory
      await fs.writeFile(
        'transactions_backup.json', 
        JSON.stringify(backupData, null, 2)
      );
    } catch (fileError) {
      console.error('Failed to save transactions to JSON file:', fileError);
    }
    // -----------------------------
      
    res.json({ success: true, transactions: allTransactions, accounts: allAccounts });
  } catch (error) {
    next(error);
  }
});
app.post('/api/plaid/create_link_token', async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const tokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Budget App',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: tokenResponse.data.link_token });
  } catch (error) {
    next(error); 
  }
});
app.post('/api/plaid/create_update_token', 
  body('tokenIndex').isInt(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // 1. Get the tokens from Clerk
      const user = await clerkClient.users.getUser(userId);
      const accessTokens = user.privateMetadata?.plaidAccessTokens || [];
      
      // 2. Find the specific broken token using the index we sent to the frontend
      const targetToken = accessTokens[req.body.tokenIndex];
      if (!targetToken) {
        return res.status(404).json({ error: 'Token not found at this index.' });
      }

      // 3. Passing an 'access_token' instead of 'products' triggers Update Mode
      const tokenResponse = await plaidClient.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'Budget App',
        country_codes: ['US'],
        language: 'en',
        access_token: targetToken, 
      });
      
      res.json({ link_token: tokenResponse.data.link_token });
    } catch (error) {
      next(error);
    }
});

// 4. Global Error Handler (Must be last)
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.response?.data || err.message || err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});

// 5. Start the server (Only if run directly, not during tests)
if (require.main === module) {
  app.listen(3000, () => {
    console.log('Backend listening on port 3000');
  });
}

// Export the app for Supertest
module.exports = app;