import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

interface SendCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitComment: (comment: { author: string; message: string; tag: string }) => void;
  defaultAuthor?: string;
}

const PRESET_TAGS = ['Shoutout', 'Birthday', 'Song Request', 'Volume Up', 'Tip / DJ Love', 'Question'];

export const SendCommentModal: React.FC<SendCommentModalProps> = ({
  isOpen,
  onClose,
  onSubmitComment,
  defaultAuthor = '',
}) => {
  const [author, setAuthor] = useState(defaultAuthor);
  const [message, setMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState('Shoutout');
  const [submitted, setSubmitted] = useState(false);

  // Sync defaultAuthor when modal opens
  React.useEffect(() => {
    if (isOpen && defaultAuthor) {
      setAuthor(defaultAuthor);
    }
  }, [isOpen, defaultAuthor]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSubmitComment({
      author: author.trim() || 'Anonymous Patron',
      message: message.trim(),
      tag: selectedTag,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setAuthor('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[#111111] border border-white/10 rounded-t-3xl sm:rounded-[32px] p-6 sm:p-7 shadow-2xl shadow-black/90 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">Send Note to Host</h3>
              <p className="text-xs text-white/50">Direct message to DJ or Stage Host</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3.5">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
              <Sparkles className="w-7 h-7 animate-bounce" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-wider text-white">Note Sent to Host!</h4>
            <p className="text-xs sm:text-sm text-white/50">Your message is live on the host screen.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
                Quick Category Tag
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all active:scale-95 ${
                      selectedTag === tag
                        ? 'bg-[#F27D26]/20 border-[#F27D26] text-[#F27D26] font-black shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
                Your Name or Table # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Table 7 or Marcus"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-4.5 py-3.5 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-white/50 mb-2">
                Your Message / Comment *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Write your note, shoutout, or request details here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-2xl p-4 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 resize-none transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white/50 hover:text-white rounded-full transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-white/90 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Send Note</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
