import { rest, RestRequest, ResponseComposition, RestContext } from 'msw';

export const customersHandlers = [
  rest.post('/customers/target_accounts', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ accounts: ['Acme Corp', 'Globex'] }));
  }),
  rest.post('/customers/target_personas', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ personas: ['CTO', 'VP Marketing'] }));
  }),
  rest.post('/customers/prospecting_sources', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ sources: ['LinkedIn', 'Crunchbase'] }));
  }),
  rest.post('/customers/correct', (
    req: RestRequest,
    res: ResponseComposition,
    ctx: RestContext
  ) => {
    return res(ctx.status(200), ctx.json({ corrected: true }));
  }),
]; 