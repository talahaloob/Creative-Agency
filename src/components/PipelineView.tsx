import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  User as UserIcon,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  Eye,
  Plus,
  ArrowRight,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead, LeadStatus } from '../types';
import { STATUS_DETAILS } from '../data/constants';

interface PipelineViewProps {
  onSelectLead: (lead: Lead) => void;
  onOpenNewLead: () => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  onSelectLead,
  onOpenNewLead,
}) => {
  const { visibleLeads, updateLead, currentUser, users } = useCrm();
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('all');

  if (!currentUser) return null;

  const filteredLeads = selectedRepFilter === 'all'
    ? visibleLeads
    : visibleLeads.filter((l) => l.salesRepId === selectedRepFilter);

  const salesUsers = users.filter((u) => u.role === 'sales');

  // The ordered pipeline stages
  const stages: LeadStatus[] = [
    'new_lead',
    'contacted',
    'interested',
    'follow_up',
    'proposal_sent',
    'negotiation',
    'won',
    'lost',
    'postponed',
  ];

  const handleAdvanceStatus = (lead: Lead, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = stages.indexOf(lead.status);
    if (direction === 'next' && currentIndex < stages.length - 1) {
      const nextStatus = stages[currentIndex + 1];
      updateLead(lead.id, { status: nextStatus });
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevStatus = stages[currentIndex - 1];
      updateLead(lead.id, { status: prevStatus });
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>مسار المبيعات (Sales Pipeline)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة انتقال العملاء عبر جميع المراحل البيعية من أول تواصل حتى إغلاق الصفقة
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">عرض مسار:</span>
              <select
                value={selectedRepFilter}
                onChange={(e) => setSelectedRepFilter(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">جميع الموظفين (All Reps)</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onOpenNewLead}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Pipeline Board Container - Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex gap-3.5 min-w-[1350px]">
          {stages.map((stageKey, idx) => {
            const stageConfig = STATUS_DETAILS[stageKey];
            const columnLeads = filteredLeads.filter((l) => l.status === stageKey);
            const stageTotalValue = columnLeads.reduce((acc, l) => acc + (l.expectedValue || 0), 0);

            return (
              <div
                key={stageKey}
                className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[78vh]"
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-slate-200/90 mb-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${stageConfig.badgeBg} ${stageConfig.badgeText}`}>
                      {stageConfig.label.split('(')[0]}
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-white rounded-full text-slate-700 border border-slate-200 shadow-2xs">
                      {columnLeads.length}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>إجمالي المرحلة:</span>
                    <span className="font-bold text-slate-800">
                      {stageTotalValue > 0 ? `${stageTotalValue.toLocaleString()} ₪` : '0 ₪'}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto pr-0.5 pl-0.5 flex-1">
                  {columnLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      لا يوجد عملاء في هذه المرحلة
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                      >
                        {/* Title & Service */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                            {lead.companyName}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {lead.contactPerson || 'غير محدد'} • {lead.service}
                          </p>
                        </div>

                        {/* Value & Sales Rep */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="font-extrabold text-indigo-700">
                            {lead.expectedValue ? `${lead.expectedValue.toLocaleString()} ₪` : '-'}
                          </span>
                          <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-medium">
                            {lead.salesRepName}
                          </span>
                        </div>

                        {/* Follow up date tag if present */}
                        {lead.nextFollowUpDate && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>متابعة: {lead.nextFollowUpDate.replace('T', ' ')}</span>
                          </div>
                        )}

                        {/* Quick stage transition buttons */}
                        <div
                          className="flex items-center justify-between pt-1.5 border-t border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            disabled={idx === 0}
                            onClick={(e) => handleAdvanceStatus(lead, 'prev', e)}
                            className={`p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ${
                              idx === 0 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title="إرجاع للمرحلة السابقة"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[10px] text-slate-400 font-medium">
                            مرحلة {idx + 1} من {stages.length}
                          </span>

                          <button
                            disabled={idx === stages.length - 1}
                            onClick={(e) => handleAdvanceStatus(lead, 'next', e)}
                            className={`p-1 rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition ${
                              idx === stages.length - 1 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title="تقديم للمرحلة التالية"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
