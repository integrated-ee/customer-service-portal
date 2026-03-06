import { acquireToken } from './msalClient.js';
import { Ticket } from '../types/index.js';

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'support@integrated.ee';

async function getGraphToken(): Promise<string> {
  return acquireToken('https://graph.microsoft.com/.default');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!to) return;

  try {
    const token = await getGraphToken();
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${NOTIFICATION_EMAIL}/sendMail`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'HTML', content: body },
            toRecipients: [{ emailAddress: { address: to } }],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`[EMAIL] Failed to send to ${to}: ${response.status} ${err}`);
    }
  } catch (err) {
    console.error('[EMAIL] Send failed:', err);
  }
}

function ticketUrl(ticketId: string): string {
  return `https://integrated-ee.github.io/customer-service-portal/tickets/${encodeURIComponent(ticketId)}`;
}

function adminTicketUrl(ticketId: string): string {
  return `https://integrated-ee.github.io/customer-service-portal/admin/tickets/${encodeURIComponent(ticketId)}`;
}

function ticketEmailBody(ticket: Ticket, heading: string, extraHtml?: string): string {
  const h = escapeHtml;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
      <h2 style="color: #1e293b;">${h(heading)}</h2>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #64748b;">Ticket</td><td style="padding: 8px; font-weight: 600;">${h(ticket.no)}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Subject</td><td style="padding: 8px;">${h(ticket.subject)}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Status</td><td style="padding: 8px;">${h(ticket.status)}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Priority</td><td style="padding: 8px;">${h(ticket.priority)}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Category</td><td style="padding: 8px;">${h(ticket.category)}</td></tr>
        ${extraHtml ? `<tr><td style="padding: 8px; color: #64748b;">Note</td><td style="padding: 8px;">${extraHtml}</td></tr>` : ''}
      </table>
      <p style="color: #64748b; font-size: 14px;">— Integrated Customer Service Portal</p>
    </div>`;
}

export async function notifyAdmins(ticket: Ticket): Promise<void> {
  const body = ticketEmailBody(
    ticket,
    'New Support Ticket',
    `Created by: ${escapeHtml(ticket.createdByEmail)}<br><a href="${adminTicketUrl(ticket.systemId)}">View in Admin Portal</a>`
  );
  await sendEmail(NOTIFICATION_EMAIL, `[New Ticket] ${ticket.no}: ${ticket.subject}`, body);
}

export async function notifyCustomer(ticket: Ticket, event: string): Promise<void> {
  const body = ticketEmailBody(
    ticket,
    event,
    `<a href="${ticketUrl(ticket.systemId)}">View Ticket</a>`
  );
  await sendEmail(ticket.createdByEmail, `[${ticket.no}] ${event}`, body);
}

export async function notifyTicketComment(
  ticket: Ticket,
  commentAuthorType: string,
  commentText: string
): Promise<void> {
  const preview = commentText.length > 200 ? commentText.substring(0, 200) + '...' : commentText;
  const safePreview = escapeHtml(preview);

  if (commentAuthorType === 'Admin') {
    const body = ticketEmailBody(
      ticket,
      'New Reply on Your Ticket',
      `<p style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 8px 0;">${safePreview}</p>
       <a href="${ticketUrl(ticket.systemId)}">View Ticket</a>`
    );
    await sendEmail(ticket.createdByEmail, `[${ticket.no}] New reply from support`, body);
  } else if (commentAuthorType === 'Customer') {
    const body = ticketEmailBody(
      ticket,
      'New Customer Comment',
      `<p style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 8px 0;">${safePreview}</p>
       <a href="${adminTicketUrl(ticket.systemId)}">View in Admin Portal</a>`
    );
    await sendEmail(NOTIFICATION_EMAIL, `[${ticket.no}] Customer comment: ${ticket.subject}`, body);
  }
}

export async function notifyStatusChange(ticket: Ticket, oldStatus: string): Promise<void> {
  const body = ticketEmailBody(
    ticket,
    `Ticket Status Changed: ${escapeHtml(oldStatus)} → ${escapeHtml(ticket.status)}`,
    `<a href="${ticketUrl(ticket.systemId)}">View Ticket</a>`
  );
  await sendEmail(ticket.createdByEmail, `[${ticket.no}] Status changed to ${ticket.status}`, body);
}
