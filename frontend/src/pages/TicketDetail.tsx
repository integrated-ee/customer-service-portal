import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiClient';
import type { Ticket, Comment, Attachment } from '../types';
import { statusColors } from '../utils/constants';

interface PastedImage {
  file: File;
  preview: string;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getTicket(id)
      .then(async (t) => {
        setTicket(t);
        const [c, a] = await Promise.all([api.getComments(t.no), api.getAttachments(t.no)]);
        setComments(c.value || []);
        setAttachments(a.value || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const preview = URL.createObjectURL(file);
        setPastedImages((prev) => [...prev, { file, preview }]);
      }
    }
  }, []);

  const removePastedImage = (index: number) => {
    setPastedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddComment = async () => {
    if (!ticket || (!newComment.trim() && pastedImages.length === 0)) return;
    setSubmitting(true);
    try {
      // Upload pasted images as attachments first
      for (const img of pastedImages) {
        const attachment = await api.uploadAttachment(ticket.no, img.file);
        setAttachments((prev) => [...prev, attachment]);
        URL.revokeObjectURL(img.preview);
      }
      // Create comment if there's text
      if (newComment.trim()) {
        const comment = await api.createComment(ticket.no, { comment: newComment });
        setComments((prev) => [...prev, comment]);
      }
      setNewComment('');
      setPastedImages([]);
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
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!ticket) return <p className="text-gray-500">Ticket not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 mt-1">#{ticket.no}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || ''}`}>
            {ticket.status}
          </span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{ticket.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>Category: <span className="font-medium text-gray-900">{ticket.category}</span></div>
          <div>Priority: <span className="font-medium text-gray-900">{ticket.priority}</span></div>
          <div>Created: <span className="font-medium text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</span></div>
          <div>Assigned To: <span className="font-medium text-gray-900">{ticket.assignedTo || '-'}</span></div>
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
                <button
                  onClick={() => handleDownload(att)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
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
        <div>
          {pastedImages.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {pastedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img.preview} alt="Pasted" className="h-20 rounded border border-gray-200 object-cover" />
                  <button
                    onClick={() => removePastedImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onPaste={handlePaste}
              placeholder="Write a comment... (paste images with Ctrl+V)"
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddComment}
              disabled={submitting || (!newComment.trim() && pastedImages.length === 0)}
              className="self-end bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
