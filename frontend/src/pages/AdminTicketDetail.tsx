import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiClient';
import type { Ticket, Comment, Attachment } from '../types';

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getTicket(id)
      .then(async (t) => {
        setTicket(t);
        setStatus(t.status);
        setPriority(t.priority);
        setCategory(t.category);
        setAssignedTo(t.assignedTo);
        const [c, a] = await Promise.all([api.getComments(t.no), api.getAttachments(t.no)]);
        setComments(c.value || []);
        setAttachments(a.value || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const updated = await api.updateTicket(id, {
        status: status as Ticket['status'],
        priority: priority as Ticket['priority'],
        category: category as Ticket['category'],
        assignedTo,
      });
      setTicket(updated);
      setSuccessMsg('Changes saved.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.createComment(ticket.no, { comment: newComment });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;
    try {
      const attachment = await api.uploadAttachment(ticket.no, file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    e.target.value = '';
  };

  const handleDownload = async (att: Attachment) => {
    try {
      const { url } = await api.getAttachmentUrl(att.ticketNo, att.lineNo);
      window.open(url, '_blank');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error && !ticket) return <p className="text-red-600">Error: {error}</p>;
  if (!ticket) return <p className="text-gray-500">Ticket not found.</p>;

  return (
    <div className="max-w-3xl">
      {/* Ticket Info + Admin Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{ticket.subject}</h1>
        <p className="text-sm text-gray-500 mb-4">#{ticket.no} | Customer: {ticket.customerNo} | Created by: {ticket.createdByEmail}</p>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{ticket.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option>New</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option>Bug</option>
              <option>Question</option>
              <option>Feature Request</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Assigned To</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {successMsg && <span className="text-sm text-green-600">{successMsg}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h2>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-500">No attachments.</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {attachments.map((att) => (
              <li key={att.systemId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{att.fileName}</span>
                <button onClick={() => handleDownload(att)} className="text-blue-600 hover:underline cursor-pointer">
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
          Upload File
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Comments</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">No comments yet.</p>
        ) : (
          <div className="space-y-4 mb-4">
            {comments.map((c) => (
              <div
                key={c.systemId}
                className={`p-3 rounded-lg text-sm ${
                  c.authorType === 'Admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">
                    {c.authorEmail}
                    {c.authorType === 'Admin' && (
                      <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Staff</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{c.comment}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="self-end bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
