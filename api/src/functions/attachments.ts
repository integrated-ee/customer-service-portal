import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, unauthorizedResponse } from '../middleware/auth.js';
import * as bcClient from '../services/bcClient.js';
import * as blobService from '../services/blobService.js';

async function verifyTicketAccess(user: { isAdmin: boolean; email: string; customerNo?: string }, ticketNo: string): Promise<boolean> {
  if (user.isAdmin) return true;
  if (!user.customerNo) {
    user.customerNo = await bcClient.resolveCustomerNo(user.email);
  }
  const ticket = await bcClient.getTicketByNo(ticketNo);
  return ticket.customerNo === user.customerNo;
}

async function uploadAttachment(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  const ticketNo = req.params.ticketNo;
  if (!ticketNo) return { status: 400, jsonBody: { error: 'Missing ticketNo' } };

  try {
    if (!await verifyTicketAccess(user, ticketNo)) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return { status: 400, jsonBody: { error: 'Missing file' } };

    if (file.size > 10 * 1024 * 1024) {
      return { status: 400, jsonBody: { error: 'File too large (max 10MB)' } };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Use modular timestamp to fit in AL Integer (32-bit signed, max ~2.1B)
    const lineNo = Date.now() % 2000000000;

    const blobUrl = await blobService.uploadFile(
      ticketNo,
      lineNo,
      file.name,
      buffer,
      file.type || 'application/octet-stream'
    );

    const attachment = await bcClient.createAttachment({
      ticketNo,
      lineNo,
      fileName: file.name,
      blobUrl,
      contentType: file.type || 'application/octet-stream',
      uploadedBy: user.email,
    });

    return { status: 201, jsonBody: attachment };
  } catch (err) {
    console.error('[attachments] uploadAttachment failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to upload attachment' } };
  }
}

async function getAttachments(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  const ticketNo = req.params.ticketNo;
  if (!ticketNo) return { status: 400, jsonBody: { error: 'Missing ticketNo' } };

  try {
    if (!await verifyTicketAccess(user, ticketNo)) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }

    const attachments = await bcClient.getAttachments(ticketNo);
    return { jsonBody: { value: attachments } };
  } catch (err) {
    console.error('[attachments] getAttachments failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to fetch attachments' } };
  }
}

async function downloadAttachment(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  const ticketNo = req.params.ticketNo;
  const lineNo = parseInt(req.params.lineNo || '0', 10);
  const fileName = req.params.fileName;

  if (!ticketNo || !lineNo || !fileName) {
    return { status: 400, jsonBody: { error: 'Missing parameters' } };
  }

  try {
    if (!await verifyTicketAccess(user, ticketNo)) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }

    const sasUrl = await blobService.getFileUrl(ticketNo, lineNo, fileName);
    return { status: 302, headers: { Location: sasUrl } };
  } catch (err) {
    console.error('[attachments] downloadAttachment failed:', err);
    return { status: 502, jsonBody: { error: 'Failed to generate download URL' } };
  }
}

app.http('uploadAttachment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'tickets/{ticketNo}/attachments',
  handler: uploadAttachment,
});

app.http('getAttachments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tickets/{ticketNo}/attachments',
  handler: getAttachments,
});

app.http('downloadAttachment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tickets/{ticketNo}/attachments/{lineNo}/{fileName}',
  handler: downloadAttachment,
});
