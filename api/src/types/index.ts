export interface Ticket {
  systemId: string;
  no: string;
  customerNo: string;
  subject: string;
  description: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed';
  category: 'Bug' | 'Question' | 'Feature Request' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  createdByEmail: string;
  resolvedAt: string;
  assignedTo: string;
  modifiedAt: string;
}

export interface Comment {
  systemId: string;
  ticketNo: string;
  lineNo: number;
  comment: string;
  authorEmail: string;
  authorType: 'Customer' | 'Admin' | 'System';
  createdAt: string;
}

export interface Attachment {
  systemId: string;
  ticketNo: string;
  lineNo: number;
  fileName: string;
  blobUrl: string;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  ticketData?: {
    subject: string;
    description: string;
    category: string;
    priority: string;
  };
}

export interface UserInfo {
  email: string;
  name: string;
  isAdmin: boolean;
  customerNo?: string;
}
