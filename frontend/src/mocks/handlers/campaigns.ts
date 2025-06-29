import { rest, RestRequest, ResponseComposition, RestContext } from 'msw';

export const campaignsHandlers = [
  rest.post('/campaigns/generate', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ sequence: ['Step 1', 'Step 2', 'Step 3'] }));
  }),
  rest.patch('/campaigns/email/:stepId/refine', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ refined: true }));
  }),
  rest.post('/campaigns/email/variant', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ variant: 'A/B' }));
  }),
]; 