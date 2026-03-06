import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import type { ChatMessage } from '../types';

interface TicketData {
  subject: string;
  description: string;
  category: string;
  priority: string;
}

export default function NewTicket() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I can help you create a support ticket. Please describe your issue and I will gather the details needed.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setSending(true);

    try {
      const res = await api.chat(updated);
      // Strip the JSON code block from the displayed message
      const displayReply = res.reply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
      setMessages((prev) => [...prev, { role: 'assistant', content: displayReply || res.reply }]);
      if (res.ticketData) {
        setTicketData(res.ticketData);
      }
    } catch (e: unknown) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong. ${e instanceof Error ? e.message : ''}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketData) return;
    setCreating(true);
    try {
      const ticket = await api.createTicket({
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category as 'Bug' | 'Question' | 'Feature Request' | 'Other',
        priority: ticketData.priority as 'Low' | 'Medium' | 'High' | 'Critical',
      });
      navigate(`/tickets/${ticket.systemId}`);
    } catch (e: unknown) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed to create ticket. ${e instanceof Error ? e.message : ''}` },
      ]);
      setTicketData(null);
    } finally {
      setCreating(false);
    }
  };

  const handleContinueChat = () => {
    setTicketData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold text-gray-900 mb-4">New Support Ticket</h1>

      <div className="flex-1 bg-white rounded-lg shadow overflow-y-auto p-4 space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {ticketData && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">Ticket Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>Subject: <span className="font-medium">{ticketData.subject}</span></div>
            <div>Category: <span className="font-medium">{ticketData.category}</span></div>
            <div>Priority: <span className="font-medium">{ticketData.priority}</span></div>
          </div>
          <p className="text-sm text-gray-700 mb-3">{ticketData.description}</p>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTicket}
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              onClick={handleContinueChat}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Continue Chat
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your issue..."
          rows={2}
          disabled={sending}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="self-end bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}
