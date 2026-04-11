import request from 'supertest';
import app from '../../app.js';

describe('Health endpoint', () => {
  it('returns 200 and success payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Server is running',
      })
    );
    expect(typeof response.body.timestamp).toBe('string');
  });
});
