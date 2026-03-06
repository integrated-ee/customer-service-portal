import { acquireToken } from './msalClient.js';
import { Ticket, Comment, Attachment } from '../types/index.js';

const TENANT_ID = process.env.BC_TENANT_ID!;
const ENVIRONMENT = process.env.BC_ENVIRONMENT || 'sandbox';

const BC_API_BASE = `https://api.businesscentral.dynamics.com/v2.0/${TENANT_ID}/${ENVIRONMENT}/api/integrated/customerService/v1.0`;

function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}

async function getToken(): Promise<string> {
  return acquireToken('https://api.businesscentral.dynamics.com/.default');
}

let cachedCompanyId: string | null = null;

async function getCompanyId(): Promise<string> {
  if (cachedCompanyId) return cachedCompanyId;

  const token = await getToken();
  const companyName = escapeOData(process.env.BC_COMPANY_NAME || 'Integrated Technologies OÜ');
  const url = `https://api.businesscentral.dynamics.com/v2.0/${TENANT_ID}/${ENVIRONMENT}/api/v2.0/companies?$filter=name eq '${companyName}'`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as { value: Array<{ id: string }> };
  if (!data.value?.length) throw new Error('Company not found');
  cachedCompanyId = data.value[0].id;
  return cachedCompanyId;
}

async function bcFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const companyId = await getCompanyId();
  const resolvedPath = path.replace('{{companyId}}', companyId);
  const url = `${BC_API_BASE}${resolvedPath}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error(`[BC API] ${options.method || 'GET'} ${resolvedPath} → ${res.status}: ${errorBody}`);
    throw new Error(`BC API error: ${res.status} ${res.statusText}`);
  }

  return res;
}

export async function getTickets(customerNo?: string): Promise<Ticket[]> {
  let path = '/companies({{companyId}})/supportTickets';
  if (customerNo) {
    path += `?$filter=customerNo eq '${escapeOData(customerNo)}'`;
  }
  const res = await bcFetch(path);
  const data = await res.json() as { value: Ticket[] };
  return data.value;
}

export async function getTicket(systemId: string): Promise<Ticket> {
  const res = await bcFetch(`/companies({{companyId}})/supportTickets(${systemId})`);
  return await res.json() as Ticket;
}

export async function getTicketByNo(ticketNo: string): Promise<Ticket> {
  const res = await bcFetch(`/companies({{companyId}})/supportTickets?$filter=no eq '${escapeOData(ticketNo)}'`);
  const data = await res.json() as { value: Ticket[] };
  if (!data.value?.length) throw new Error(`Ticket ${ticketNo} not found`);
  return data.value[0];
}

export async function createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
  const res = await bcFetch('/companies({{companyId}})/supportTickets', {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
  return await res.json() as Ticket;
}

export async function updateTicket(systemId: string, data: Partial<Ticket>, etag: string): Promise<Ticket> {
  const res = await bcFetch(`/companies({{companyId}})/supportTickets(${systemId})`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'If-Match': etag },
  });
  return await res.json() as Ticket;
}

export async function getComments(ticketNo: string): Promise<Comment[]> {
  const res = await bcFetch(`/companies({{companyId}})/ticketComments?$filter=ticketNo eq '${escapeOData(ticketNo)}'`);
  const data = await res.json() as { value: Comment[] };
  return data.value;
}

export async function createComment(comment: Partial<Comment>): Promise<Comment> {
  const res = await bcFetch('/companies({{companyId}})/ticketComments', {
    method: 'POST',
    body: JSON.stringify(comment),
  });
  return await res.json() as Comment;
}

export async function getAttachments(ticketNo: string): Promise<Attachment[]> {
  const res = await bcFetch(`/companies({{companyId}})/ticketAttachments?$filter=ticketNo eq '${escapeOData(ticketNo)}'`);
  const data = await res.json() as { value: Attachment[] };
  return data.value;
}

export async function createAttachment(attachment: Partial<Attachment>): Promise<Attachment> {
  const res = await bcFetch('/companies({{companyId}})/ticketAttachments', {
    method: 'POST',
    body: JSON.stringify(attachment),
  });
  return await res.json() as Attachment;
}

export async function resolveCustomerNo(email: string): Promise<string | undefined> {
  const safeEmail = escapeOData(email);
  const exactRes = await bcFetch(
    `/companies({{companyId}})/customerEmailMappings?$filter=email eq '${safeEmail}' and matchType eq 'Exact'`
  );
  const exactData = await exactRes.json() as { value: Array<{ customerNo: string }> };
  if (exactData.value?.length) return exactData.value[0].customerNo;

  const domain = email.split('@')[1];
  if (domain) {
    const safeDomain = escapeOData(domain);
    const domainRes = await bcFetch(
      `/companies({{companyId}})/customerEmailMappings?$filter=email eq '${safeDomain}' and matchType eq 'Domain'`
    );
    const domainData = await domainRes.json() as { value: Array<{ customerNo: string }> };
    if (domainData.value?.length) return domainData.value[0].customerNo;
  }

  return undefined;
}
