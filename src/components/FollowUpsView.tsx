import React, { useState } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Building2,
  ArrowUpRight,
  ExternalLink,
  History,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead } from '../types';
import { STATUS_DETAILS } from '../data/constants';

interface FollowUpsViewProps {
  onSelectLead: (lead: Lead) => void;
  onOpenFollowUpModal: (lead: Lead) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  onSelectLead,
  onOpenFollowUpModal,
}) => {
  const { visibleLeads, followUpLogs, currentUser } = useCrm();

  const [activeSubTab, setActiveSubTab] = useState<'today' | 'overdue' | 'upcoming' | 'history'>('today');

  if (!currentUser) return null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Active leads with a scheduled followup (excluding won/lost)
  const activeLeadsWithFollowUp = visibleLeads.filter(
    (l) => l.nextFollowUpDate && l.status !== 'won' && l.status !== 'lost'
  );

  // Categorize
  const overdueLeads = activeLeadsWithFollowUp.filter((l) => {
    const leadDateStr = l.nextFollowUpDate.split('T')[0];
    return leadDateStr < todayStr;
  });

  const todayLeads = activeLeadsWithFollowUp.filter((l) => {
    const leadDateStr = l.nextFollowUpDate.split('T')[0];
    return leadDateStr === todayStr;
  });

  const upcomingLeads = activeLeadsWithFollowUp.filter((l) => {
    const leadDateStr = l.nextFollowUpDate.split('T')[0];
    return leadDateStr > todayStr;
  });

  // Filter history logs for current user (or all if admin)
  const relevantLogs = currentUser.role === 'admin'
    ? followUpLogs
    : followUpLogs.filter((f) => f.salesRepId === currentUser.id);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-indigo-600" />
          <span>جدول ومواعيد المتابعات (Follow-up Schedule)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          متابعة المواعيد المستحقة، المتأخرة، وتوثيق نتائج التواصل مع العملاء أولاً بأول
        </p>
      </div>

      {/* Stats row & Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today's Followups Tab */}
        <button
          onClick={() => setActiveSubTab('today')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            activeSubTab === 'today'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold">متابعات اليوم</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-1">{todayLeads.length}</p>
          <span className="text-[11px] text-indigo-600 font-medium">مطلوب التواصل اليوم</span>
        </button>

        {/* Overdue Followups Tab */}
        <button
          onClick={() => setActiveSubTab('overdue')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            activeSubTab === 'overdue'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold">متأخرة عن الموعد</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1">{overdueLeads.length}</p>
          <span className="text-[11px] text-rose-600 font-medium">تحتاج تواصل عاجل</span>
        </button>

        {/* Upcoming Followups Tab */}
        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            activeSubTab === 'upcoming'
              ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-xs font-bold">الأيام القادمة</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-sky-900 mt-1">{upcomingLeads.length}</p>
          <span className="text-[11px] text-sky-600 font-medium">مجدولة لاحقاً</span>
        </button>

        {/* History Logs Tab */}
        <button
          onClick={() => setActiveSubTab('history')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold">سجل النتائج</span>
            <History className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-purple-900 mt-1">{relevantLogs.length}</p>
          <span className="text-[11px] text-purple-600 font-medium">المتابعات الموثقة</span>
        </button>
      </div>

      {/* Main List Section */}
      <div className="space-y-3">
        {activeSubTab === 'today' && (
          <FollowUpListSection
            title="مواعيد المتابعة لليوم"
            description="العملاء المتوقع التواصل معهم خلال ساعات اليوم"
            leads={todayLeads}
            onSelectLead={onSelectLead}
            onOpenFollowUpModal={onOpenFollowUpModal}
            emptyMessage="لا توجد مواعيد متابعة مستحقة لهذا اليوم. عمل رائع!"
          />
        )}

        {activeSubTab === 'overdue' && (
          <FollowUpListSection
            title="متابعات متأخرة عن موعدها (Overdue)"
            description="عملاء تجاوزوا تاريخ المتابعة المحدد دون توثيق نتيجة جديدة"
            leads={overdueLeads}
            onSelectLead={onSelectLead}
            onOpenFollowUpModal={onOpenFollowUpModal}
            emptyMessage="رائع! لا توجد أي متابعات متأخرة لديك حالياً."
            isOverdue
          />
        )}

        {activeSubTab === 'upcoming' && (
          <FollowUpListSection
            title="مواعيد المتابعة القادمة"
            description="العملاء المجدول التواصل معهم في الأيام القادمة"
            leads={upcomingLeads}
            onSelectLead={onSelectLead}
            onOpenFollowUpModal={onOpenFollowUpModal}
            emptyMessage="لا توجد مواعيد متابعة مجدولة للأيام القادمة."
          />
        )}

        {activeSubTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              سجل نتائج المتابعات المسجلة ({relevantLogs.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              جميع نتائج المحادثات والمكالمات التي تم توثيقها في النظام
            </p>

            {relevantLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl">
                لم يتم تسجيل أي نتائج متابعة بعد.
              </p>
            ) : (
              <div className="space-y-3">
                {relevantLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{log.leadTitle}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                          {log.channel}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400" dir="ltr">
                        {new Date(log.completedDate || log.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>

                    <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                      {log.resultNote}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>المسؤول: <strong className="text-slate-700">{log.salesRepName}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <span>الحالة:</span>
                        <span className="font-bold text-slate-800">{STATUS_DETAILS[log.newStatus]?.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface FollowUpListSectionProps {
  title: string;
  description: string;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenFollowUpModal: (lead: Lead) => void;
  emptyMessage: string;
  isOverdue?: boolean;
}

const FollowUpListSection: React.FC<FollowUpListSectionProps> = ({
  title,
  description,
  leads,
  onSelectLead,
  onOpenFollowUpModal,
  emptyMessage,
  isOverdue = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>

      {leads.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const st = STATUS_DETAILS[lead.status] || STATUS_DETAILS.new_lead;
            const cleanPhone = lead.whatsapp.replace(/[^0-9]/g, '');
            const waUrl = cleanPhone.startsWith('966') || cleanPhone.startsWith('00')
              ? `https://wa.me/${cleanPhone.replace(/^00/, '')}`
              : `https://wa.me/966${cleanPhone.replace(/^0/, '')}`;

            return (
              <div
                key={lead.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Lead info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => onSelectLead(lead)}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition cursor-pointer"
                    >
                      {lead.companyName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badgeBg} ${st.badgeText}`}>
                      {st.label.split('(')[0]}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    المسؤول: <strong>{lead.salesRepName}</strong> • {lead.contactPerson || 'غير محدد'} • {lead.service}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1 font-bold text-indigo-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      الموعد: {lead.nextFollowUpDate.replace('T', ' ')}
                    </span>
                    {lead.expectedValue > 0 && (
                      <span>القيمة: {lead.expectedValue.toLocaleString()} ₪</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${lead.phone}`}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                    title={`اتصال: ${lead.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition"
                    title="محادثة واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onOpenFollowUpModal(lead)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تسجيل النتيجة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
