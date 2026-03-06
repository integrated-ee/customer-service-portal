import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, unauthorizedResponse } from '../middleware/auth.js';
import * as bcClient from '../services/bcClient.js';
import { notifyTicketComment } from '../services/emailService.js';

async function verifyTicketAccess(user: { isAdmin: boolean; email: string; customerNo?: string }, ticketNo: string): Promise<boolean> {
  if (user.isAdmin) return true;
  if (!user.customerNo) {
    user.customerNo = await bcClient.resolveCustomerNo(user.email);
  }
  const ticket = await bcClient.getTicketByNo(ticketNo);
  return ticket.customerNo === user.customerNo;
}

async function getComments(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  const ticketNo = req.params.ticketNo;
  if (!ticketNo) return { status: 400, jsonBody: { error: 'Missing ticketNo' } };

  try {
    if (!await verifyTicketAccess(user, ticketNo)) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }

    const comments = await bcClient.getComments(ticketNo);
    return { jsonBody: { value: comments } };
  } catch (err) {
    console.error('[comments] getComments failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to fetch comments' } };
  }
}

async function createComment(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  const ticketNo = req.params.ticketNo;
  if (!ticketNo) return { status: 400, jsonBody: { error: 'Missing ticketNo' } };

  try {
    if (!await verifyTicketAccess(user, ticketNo)) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }

    const body = await req.json() as { comment: string };
    if (!body.comment?.trim()) {
      return { status: 400, jsonBody: { error: 'Comment cannot be empty' } };
    }

    const authorType = user.isAdmin ? 'Admin' : 'Customer';
    const comment = await bcClient.createComment({
      ticketNo,
      comment: body.comment,
      authorEmail: user.email,
      authorType,
    });

    // Send email notification (fire-and-forget)
    bcClient.getTicketByNo(ticketNo)
      .then(ticket => notifyTicketComment(ticket, authorType, body.comment))
      .catch(err => console.error('[EMAIL] Comment notification failed:', err));

    return { status: 201, jsonBody: comment };
  } catch (err) {
    console.error('[comments] createComment failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to create comment' } };
  }
}

app.http('getComments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tickets/{ticketNo}/comments',
  handler: getComments,
});

app.http('createComment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'tickets/{ticketNo}/comments',
  handler: createComment,
});
