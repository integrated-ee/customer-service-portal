import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, unauthorizedResponse } from '../middleware/auth.js';
import { resolveCustomerNo } from '../services/bcClient.js';

async function meHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  try {
    if (!user.isAdmin && !user.customerNo) {
      user.customerNo = await resolveCustomerNo(user.email);
    }

    return { jsonBody: user };
  } catch (err) {
    console.error('[me] meHandler failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to resolve user info' } };
  }
}

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'me',
  handler: meHandler,
});
