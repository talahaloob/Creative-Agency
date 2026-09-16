import React, { useState } from 'react';
import { X, CalendarClock, CheckCircle, MessageSquare, Phone, Layers } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead, LeadStatus, ContactChannel } from '../types';
import { STATUS_DETAILS, CONTACT_CHANNELS } from '../data/constants';

interface FollowUpModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ lead, isOpen, onClose }) => {
  const { recordFollowUp } = useCrm();

  if (!isOpen || !lead) return null;

  const [resultNote, setResultNote] = useState('');
  const [channel, setChannel] = useState<ContactChannel>(lead.channel || 'Call');
  const [newStatus, setNewStatus] = useState<LeadStatus>(lead.status);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultNote.trim()) {
      setError('يرجى كتابة نتيجة المتابعة أو ملخص الحوار مع العميل');
      return;
    }

    recordFollowUp({
      leadId: lead.id,
      resultNote: resultNote.trim(),
      channel,
      newStatus,
      nextFollowUpDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-700 to-blue-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">تسجيل نتيجة المتابعة</h3>
              <p className="text-xs text-indigo-100">{lead.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Used */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              طريقة التواصل المستخدمة
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ContactChannel)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {CONTACT_CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>

          {/* Result Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              نتيجة المتابعة والملاحظات <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="اكتب ماذا حدث في المكالمة / الاجتماع، هل العميل مهتم، ما هي الخطوة القادمة..."
              value={resultNote}
              onChange={(e) => {
                setResultNote(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* New Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              تحديث حالة العميل (Status)
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
              className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Object.entries(STATUS_DETAILS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Next Follow-up Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
              تحديد موعد المتابعة القادمة
            </label>
            <input
              type="datetime-local"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              اتركه فارغاً إذا أغلقت الصفقة أو تم إنهاء التواصل.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>حفظ نتيجة المتابعة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
