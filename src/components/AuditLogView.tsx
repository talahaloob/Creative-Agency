import React, { useState } from 'react';
import { History, ShieldCheck, User as UserIcon, Calendar, Search } from 'lucide-react';
import { useCrm } from '../context/CrmContext';

export const AuditLogView: React.FC = () => {
  const { auditLogs, currentUser } = useCrm();
  const [search, setSearch] = useState('');

  if (!currentUser) return null;

  const userScopedLogs = currentUser.role === 'admin'
    ? auditLogs
    : auditLogs.filter((log) => log.userId === currentUser.id);

  const filteredLogs = userScopedLogs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.leadName && log.leadName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>
              {currentUser.role === 'admin'
                ? 'سجل التعديلات والنشاطات الشامل (System Audit Trail)'
                : 'سجل نشاطاتي وتعديلاتي الشخصية'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.role === 'admin'
              ? 'توثيق دقيق لكل عملية تعديل، إضافة عميل، أو صرف عمولة لكل فريق العمل'
              : 'توثيق خاص ومحمي لكافة العمليات التي قمت بها في حسابك'}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في السجل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            لا توجد سجلات تطابق البحث.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                        log.userRole === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.userRole === 'admin' ? 'إدارة' : 'مبيعات'}
                    </span>
                    {log.leadName && (
                      <span className="text-slate-400">
                        • العميل: <strong className="text-indigo-700">{log.leadName}</strong>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400" dir="ltr">
                    {new Date(log.timestamp).toLocaleString('ar-SA')}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                    {log.action}
                  </span>
                  <p className="text-slate-600 leading-relaxed font-normal">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
