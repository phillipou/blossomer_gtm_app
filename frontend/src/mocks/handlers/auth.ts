import { rest, RestRequest, ResponseComposition, RestContext } from 'msw';

export const authHandlers = [
  // Mock signup endpoint
  rest.post('/auth/signup', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    // Example: always return a fake API key
    return res(
      ctx.status(200),
      ctx.json({ api_key: 'mocked-api-key-123' })
    );
  }),
  // Mock validate_key endpoint
  rest.post('/auth/validate_key', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    // Example: always valid
    return res(ctx.status(200), ctx.json({ valid: true }));
  }),
]; 