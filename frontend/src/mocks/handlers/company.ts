import { rest, RestRequest, ResponseComposition, RestContext } from 'msw';

export const companyHandlers = [
  rest.post('/company/generate', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(
      ctx.status(200),
      ctx.json({
        session_id: 'mock-session-1',
        company: { name: 'Mock Company', overview: 'AI-generated overview...' },
      })
    );
  }),
  rest.patch('/company/:block/refine', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ refined: true }));
  }),
  rest.post('/company/:block/regenerate', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ regenerated: true }));
  }),
]; 