import React, { useState } from 'react';
import { MessageSquare, Send, X, Smartphone } from 'lucide-react';
import { sendTestSmsApi } from '../../api/sms';
import { useToast } from '../../context/ToastContext';

interface TestSmsModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const TestSmsModal: React.FC<TestSmsModalProps> = ({ isOpen, message, onClose }) => {
  const { showToast } = useToast();
  const [phone, setPhone] = useState('+251911223344');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      showToast('error', 'Please enter a valid phone number');
      return;
    }

    setIsSending(true);
    try {
      await sendTestSmsApi(phone, message);
      showToast('success', `Test SMS dispatched successfully to ${phone}!`);
      onClose();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send test SMS');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#1A5B4B]" /> Send Test SMS Message
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSendTest} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Test Phone Number</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251911223344"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#1A5B4B]"
            />
            <p className="text-[11px] text-slate-500 mt-1">Simulated via Twilio Sandbox environment</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Message Preview:</span>
            <p className="text-slate-600 italic line-clamp-3">"{message || 'No message composed yet'}"</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="px-4 py-2 rounded-xl bg-[#1A5B4B] text-white text-xs font-semibold hover:bg-[#14483B] flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Sending...' : 'Send Test SMS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
