const request = require('supertest');
const app = require('../index');

// 1. Mock Clerk Middleware and Auth
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: () => ({ userId: 'test_user_123' }),
  clerkClient: {
    users: {
      // Mock retrieving a user with no existing bank connections
      getUser: jest.fn().mockResolvedValue({
        privateMetadata: { plaidAccessTokens: [] }
      }),
      // Mock saving the tokens back to Clerk
      updateUserMetadata: jest.fn().mockResolvedValue({})
    }
  }
}));

// 2. Mock Plaid Client
jest.mock('plaid', () => ({
  Configuration: jest.fn(),
  PlaidEnvironments: { sandbox: 'sandbox' },
  PlaidApi: jest.fn().mockImplementation(() => ({
    linkTokenCreate: jest.fn().mockResolvedValue({ 
      data: { link_token: 'mock_link_token_abc123' } 
    }),
    itemPublicTokenExchange: jest.fn().mockResolvedValue({
      data: { access_token: 'mock_access_token_xyz789' }
    })
  }))
}));

// 3. Route Tests
describe('Plaid API Routes', () => {

  describe('POST /api/plaid/create_link_token', () => {
    it('returns a 200 status and a link token for authenticated users', async () => {
      const response = await request(app).post('/api/plaid/create_link_token');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('link_token', 'mock_link_token_abc123');
    });
  });

  describe('POST /api/plaid/exchange_public_token', () => {
    it('returns 400 if public_token body parameter is missing', async () => {
      const response = await request(app)
        .post('/api/plaid/exchange_public_token')
        .send({}); // Sending empty body to trigger express-validator
        
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('returns a 200 status on successful token exchange', async () => {
      const response = await request(app)
        .post('/api/plaid/exchange_public_token')
        .send({ public_token: 'public-sandbox-123' });
        
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

});