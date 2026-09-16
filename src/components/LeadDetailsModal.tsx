import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Building2,
  User as UserIcon,
  MapPin,
  Briefcase,
  Layers,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Clock,
  History,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead, LeadStatus } from '../types';
import { STATUS_DETAILS } from '../data/constants';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onOpenFollowUp: (lead: Lead) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onOpenFollowUp,
}) => {
  const { currentUser, deleteLead, updateLead, auditLogs, followUpLogs } = useCrm();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!isOpen || !lead || !currentUser) return null;

  const currentStatusObj = STATUS_DETAILS[lead.status] || STATUS_DETAILS.new_lead;
  const leadAudits = auditLogs.filter((a) => a.leadId === lead.id);
  const leadFollowUps = followUpLogs.filter((f) => f.leadId === lead.id);

  // WhatsApp link formatter (strips non digits)
  const cleanPhone = lead.whatsapp.replace(/[^0-9]/g, '');
  const waUrl = cleanPhone.startsWith('966') || cleanPhone.startsWith('00')
    ? `https://wa.me/${cleanPhone.replace(/^00/, '')}`
    : `https://wa.me/966${cleanPhone.replace(/^0/, '')}`;

  const handleDelete = () => {
    if (currentUser.role !== 'admin') {
      alert('غير مصرح لك بحذف العملاء.');
      return;
    }
    const res = deleteLead(lead.id);
    if (res.success) {
      onClose();
    } else {
      alert(res.error);
    }
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateLead(lead.id, { status: newStatus });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${currentStatusObj.badgeBg} ${currentStatusObj.badgeText}`}>
                {currentStatusObj.label}
              </span>
              <span className="text-xs text-slate-300">
                المسؤول: <strong className="text-indigo-300">{lead.salesRepName}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">{lead.companyName}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{lead.contactPerson || 'بدون اسم مسؤول'}</span>
              <span>•</span>
              <span>{lead.city}</span>
              <span>•</span>
              <span>{lead.businessType}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(lead)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="تعديل بيانات العميل"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Contact Action Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال ({lead.phone})</span>
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>محادثة WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={() => onOpenFollowUp(lead)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>تسجيل نتيجة متابعة</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Section: Status Change Pipeline */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              تحديث مرحلة العميل (Quick Status Transition):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_DETAILS) as LeadStatus[]).map((st) => {
                const isCurrent = lead.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                      isCurrent
                        ? `${STATUS_DETAILS[st].badgeBg} ${STATUS_DETAILS[st].badgeText} ring-2 ring-indigo-400 font-bold`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {STATUS_DETAILS[st].label.split('(')[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-[11px] font-medium text-indigo-700 block">قيمة الصفقة المتوقعة</span>
              <span className="text-base font-extrabold text-indigo-900 mt-1 block">
                {lead.expectedValue ? `${lead.expectedValue.toLocaleString()} ₪` : 'غير محددة'}
              </span>
            </div>
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-[11px] font-medium text-purple-700 block">الخدمة المطلوبة</span>
              <span className="text-xs font-bold text-purple-900 mt-1 block truncate" title={lead.service}>
                {lead.service}
              </span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-[11px] font-medium text-blue-700 block">مصدر العميل</span>
              <span className="text-xs font-bold text-blue-900 mt-1 block truncate">
                {lead.source}
              </span>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <span className="text-[11px] font-medium text-amber-700 block">المتابعة القادمة</span>
              <span className="text-xs font-bold text-amber-900 mt-1 block">
                {lead.nextFollowUpDate
                  ? lead.nextFollowUpDate.replace('T', ' ')
                  : 'لم يُحدد موعد'}
              </span>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              بيانات التواصل والمشروع
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">طريقة أول تواصل:</span>
                <span className="font-semibold text-slate-800">{lead.channel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">تاريخ أول تواصل:</span>
                <span className="font-semibold text-slate-800">{lead.firstContactDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">آخر اتصال / تحديث:</span>
                <span className="font-semibold text-slate-800">{lead.lastContactDate || lead.firstContactDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">المدينة:</span>
                <span className="font-semibold text-slate-800">{lead.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">نوع النشاط:</span>
                <span className="font-semibold text-slate-800">{lead.businessType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">تاريخ الإنشاء في النظام:</span>
                <span className="font-semibold text-slate-800" dir="ltr">{new Date(lead.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>

            {/* Notes Section */}
            {lead.notes && (
              <div className="pt-2">
                <span className="text-slate-500 text-xs block mb-1 font-semibold">ملاحظات العميل وسجل الحوار:</span>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {lead.notes}
                </div>
              </div>
            )}
          </div>

          {/* Audit History & Followups Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              سجل التعديلات والنشاطات لهذا العميل (Audit Trail)
            </h4>

            {leadAudits.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
                لا توجد سجلات تعديل إضافية مسجلة بعد.
              </p>
            ) : (
              <div className="space-y-2">
                {leadAudits.map((a) => (
                  <div key={a.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="font-bold text-indigo-700">{a.userName} ({a.userRole === 'admin' ? 'مدير' : 'مبيعات'})</span>
                      <span dir="ltr">{new Date(a.timestamp).toLocaleString('ar-SA')}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{a.action}</p>
                    <p className="text-slate-600">{a.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Logs */}
          {leadFollowUps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                نتائج المتابعات السابقة ({leadFollowUps.length})
              </h4>
              <div className="space-y-2">
                {leadFollowUps.map((f) => (
                  <div key={f.id} className="p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{f.salesRepName}</span>
                      <span dir="ltr">{new Date(f.completedDate || f.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{f.resultNote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete lead section (Admin only, as mandated) */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {currentUser.role === 'admin' ? (
              <div>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف العميل من النظام</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <span className="text-xs text-rose-800 font-bold">هل أنت متأكد من الحذف النهائي؟</span>
                    <button
                      onClick={handleDelete}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300 transition cursor-pointer"
                    >
                      تراجع
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">
                * حذف العميل محصور بصلاحيات الإدارة (Admin) فقط للحفاظ على نزاهة البيانات.
              </span>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
