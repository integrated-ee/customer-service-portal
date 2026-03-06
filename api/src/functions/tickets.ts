import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, unauthorizedResponse } from '../middleware/auth.js';
import * as bcClient from '../services/bcClient.js';
import { notifyAdmins, notifyStatusChange } from '../services/emailService.js';

async function getTickets(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  try {
    if (!user.isAdmin && !user.customerNo) {
      user.customerNo = await bcClient.resolveCustomerNo(user.email);
    }

    const tickets = await bcClient.getTickets(user.isAdmin ? undefined : user.customerNo);
    return { jsonBody: { value: tickets } };
  } catch (err) {
    console.error('[tickets] getTickets failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to fetch tickets' } };
  }
}

async function getTicket(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: 'Missing ticket id' } };

  try {
    const ticket = await bcClient.getTicket(id);

    if (!user.isAdmin) {
      if (!user.customerNo) {
        user.customerNo = await bcClient.resolveCustomerNo(user.email);
      }
      if (ticket.customerNo !== user.customerNo) {
        return { status: 403, jsonBody: { error: 'Forbidden' } };
      }
    }

    return { jsonBody: ticket };
  } catch (err) {
    console.error('[tickets] getTicket failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to fetch ticket' } };
  }
}

async function createTicket(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  try {
    if (!user.isAdmin && !user.customerNo) {
      user.customerNo = await bcClient.resolveCustomerNo(user.email);
    }

    const body = await req.json() as Record<string, unknown>;
    const ticket = await bcClient.createTicket({
      ...body,
      createdByEmail: user.email,
      customerNo: user.customerNo,
    });

    // Notify admins (fire-and-forget)
    notifyAdmins(ticket).catch(err => console.error('[EMAIL] Admin notification failed:', err));

    return { status: 201, jsonBody: ticket };
  } catch (err) {
    console.error('[tickets] createTicket failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to create ticket' } };
  }
}

async function updateTicket(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  if (!user.isAdmin) {
    return { status: 403, jsonBody: { error: 'Only admins can update tickets' } };
  }

  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: 'Missing ticket id' } };

  try {
    const etag = req.headers.get('if-match') || '*';
    const body = await req.json() as Record<string, unknown>;

    // Get current ticket to detect status change
    const oldTicket = await bcClient.getTicket(id);
    const ticket = await bcClient.updateTicket(id, body, etag);

    // Notify customer on status change (fire-and-forget)
    if (body.status && oldTicket.status !== ticket.status) {
      notifyStatusChange(ticket, oldTicket.status).catch(err =>
        console.error('[EMAIL] Status notification failed:', err)
      );
    }

    return { jsonBody: ticket };
  } catch (err) {
    console.error('[tickets] updateTicket failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to update ticket' } };
  }
}

app.http('getTickets', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tickets',
  handler: getTickets,
});

app.http('getTicket', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tickets/{id}',
  handler: getTicket,
});

app.http('createTicket', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'tickets',
  handler: createTicket,
});

app.http('updateTicket', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'tickets/{id}',
  handler: updateTicket,
});
