import { PublicClientApplication } from '@azure/msal-browser';
import { apiScope } from './authConfig';
import type { Ticket, Comment, Attachment, ChatMessage, UserInfo } from '../types';

let msalInstance: PublicClientApplication | null = null;

export function setMsalInstance(instance: PublicClientApplication) {
  msalInstance = instance;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function getToken(): Promise<string> {
  if (!msalInstance) throw new Error('MSAL not initialized');
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) throw new Error('No authenticated user');

  const response = await msalInstance.acquireTokenSilent({
    scopes: [apiScope],
    account: accounts[0],
  });
  return response.accessToken;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Tickets
  getTickets: () => apiRequest<{ value: Ticket[] }>('/tickets'),
  getTicket: (id: string) => apiRequest<Ticket>(`/tickets/${id}`),
  createTicket: (data: Partial<Ticket>) =>
    apiRequest<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id: string, data: Partial<Ticket>) =>
    apiRequest<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Comments
  getComments: (ticketId: string) =>
    apiRequest<{ value: Comment[] }>(`/tickets/${ticketId}/comments`),
  createComment: (ticketId: string, data: { comment: string }) =>
    apiRequest<Comment>(`/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify(data) }),

  // Attachments
  getAttachments: (ticketId: string) =>
    apiRequest<{ value: Attachment[] }>(`/tickets/${ticketId}/attachments`),
  uploadAttachment: async (ticketId: string, file: File) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }
    return response.json();
  },
  getAttachmentUrl: (ticketId: string, lineNo: number) =>
    apiRequest<{ url: string }>(`/tickets/${ticketId}/attachments/${lineNo}`),

  // Chat
  chat: (messages: ChatMessage[]) =>
    apiRequest<{ reply: string; ticketData?: { subject: string; description: string; category: string; priority: string } }>('/chat', { method: 'POST', body: JSON.stringify({ messages }) }),

  // User
  getMe: () => apiRequest<UserInfo>('/me'),
};
