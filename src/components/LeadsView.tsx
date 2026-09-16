import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  User as UserIcon,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead, LeadStatus } from '../types';
import { STATUS_DETAILS, CITIES } from '../data/constants';

interface LeadsViewProps {
  onSelectLead: (lead: Lead) => void;
  onOpenNewLead: () => void;
  onEditLead: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  onSelectLead,
  onOpenNewLead,
  onEditLead,
}) => {
  const { visibleLeads, currentUser, users } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  if (!currentUser) return null;

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return visibleLeads.filter((lead) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          lead.companyName.toLowerCase().includes(q) ||
          lead.contactPerson.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.service.toLowerCase().includes(q) ||
          lead.city.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }

      // Rep filter (for Admin)
      if (repFilter !== 'all' && lead.salesRepId !== repFilter) {
        return false;
      }

      // City filter
      if (cityFilter !== 'all' && lead.city !== cityFilter) {
        return false;
      }

      return true;
    });
  }, [visibleLeads, searchTerm, statusFilter, repFilter, cityFilter]);

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            قاعدة بيانات العملاء المحتملين (Leads)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.role === 'admin'
              ? `عرض كل العملاء المسجلين (${filteredLeads.length} من إجمالي ${visibleLeads.length})`
              : `عملائك المسجلين باسمك (${filteredLeads.length} عميل)`}
          </p>
        </div>

        <button
          onClick={onOpenNewLead}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة Lead جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الشركة، الهاتف، أو الخدمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium"
            >
              <option value="all">جميع الحالات (All Statuses)</option>
              {Object.entries(STATUS_DETAILS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rep Filter (Admin only) */}
          {currentUser.role === 'admin' ? (
            <div>
              <select
                value={repFilter}
                onChange={(e) => setRepFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium"
              >
                <option value="all">جميع موظفي المبيعات</option>
                {users
                  .filter((u) => u.role === 'sales' || u.role === 'admin')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'admin' ? 'إدارة' : 'مبيعات'})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="hidden lg:block">
              <input
                type="text"
                disabled
                value={`المسؤول: ${currentUser.name}`}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-semibold"
              />
            </div>
          )}

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium"
            >
              <option value="all">جميع المدن</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Reset if filters active */}
        {(searchTerm || statusFilter !== 'all' || repFilter !== 'all' || cityFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">تم تفعيل معايير التصفية.</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRepFilter('all');
                setCityFilter('all');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Table of Leads */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">لا يوجد عملاء يطابقون البحث</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              تأكد من شروط البحث أو الفلاتر المحددة، أو قم بإضافة عميل جديد الآن.
            </p>
            <button
              onClick={onOpenNewLead}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition cursor-pointer"
            >
              + إضافة عميل جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">العميل / الشركة</th>
                  <th className="py-3 px-4">الموظف المسؤول</th>
                  <th className="py-3 px-4">الاتصال السريع</th>
                  <th className="py-3 px-4">الخدمة والمدينة</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">المتابعة القادمة</th>
                  <th className="py-3 px-4">القيمة المتوقعة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const st = STATUS_DETAILS[lead.status] || STATUS_DETAILS.new_lead;
                  const cleanPhone = lead.whatsapp.replace(/[^0-9]/g, '');
                  const waUrl = cleanPhone.startsWith('966') || cleanPhone.startsWith('00')
                    ? `https://wa.me/${cleanPhone.replace(/^00/, '')}`
                    : `https://wa.me/966${cleanPhone.replace(/^0/, '')}`;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-indigo-50/30 transition group cursor-pointer"
                      onClick={() => onSelectLead(lead)}
                    >
                      {/* Company & Contact Person */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition">
                            {lead.companyName}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {lead.contactPerson || 'غير محدد'}
                          </span>
                        </div>
                      </td>

                      {/* Sales Rep */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {lead.salesRepName}
                        </span>
                      </td>

                      {/* Phone & WhatsApp Quick Links */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${lead.phone}`}
                            title={`اتصال: ${lead.phone}`}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`واتساب: ${lead.whatsapp}`}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Service & City */}
                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-medium block truncate max-w-[170px]" title={lead.service}>
                          {lead.service}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{lead.city} • {lead.businessType}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${st.badgeBg} ${st.badgeText}`}>
                          {st.label.split('(')[0].trim()}
                        </span>
                      </td>

                      {/* Next Followup */}
                      <td className="py-3 px-4">
                        {lead.nextFollowUpDate ? (
                          <span className="text-[11px] font-medium text-slate-700 block">
                            {lead.nextFollowUpDate.replace('T', ' ')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Expected Value */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {lead.expectedValue ? `${lead.expectedValue.toLocaleString()} ₪` : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
