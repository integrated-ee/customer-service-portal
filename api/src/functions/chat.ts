import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, unauthorizedResponse } from '../middleware/auth.js';
import { chat } from '../services/aiService.js';
import { ChatMessage } from '../types/index.js';

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 5000;

function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  return messages.every(
    (m) =>
      typeof m === 'object' && m !== null &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.length > 0 &&
      m.content.length <= MAX_MESSAGE_LENGTH
  );
}

async function chatHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const user = await authenticateRequest(req.headers.get('authorization'));
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json() as { messages: unknown };
    if (!validateMessages(body.messages)) {
      return { status: 400, jsonBody: { error: `Invalid messages: must be 1-${MAX_MESSAGES} messages, each up to ${MAX_MESSAGE_LENGTH} chars` } };
    }

    const response = await chat(body.messages);
    return { jsonBody: response };
  } catch (err) {
    console.error('[chat] chatHandler failed:', err);
    return { status: 502, jsonBody: { error: 'Chat service unavailable' } };
  }
}

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'chat',
  handler: chatHandler,
});
