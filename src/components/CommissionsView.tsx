import React, { useState } from 'react';
import {
  CircleDollarSign,
  CheckCircle,
  Clock,
  CreditCard,
  Building2,
  User as UserIcon,
  Award,
  Filter,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { CommissionStatus, Commission } from '../types';

export const CommissionsView: React.FC = () => {
  const { commissions, updateCommissionStatus, currentUser, users } = useCrm();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');

  if (!currentUser) return null;

  // Filter for Sales Rep or Admin
  const visibleCommissions = currentUser.role === 'admin'
    ? commissions
    : commissions.filter((c) => c.salesRepId === currentUser.id);

  const filteredCommissions = visibleCommissions.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (repFilter !== 'all' && c.salesRepId !== repFilter) return false;
    return true;
  });

  // Aggregated totals
  const totalAmount = visibleCommissions.reduce((acc, c) => acc + c.commissionAmount, 0);
  const pendingAmount = visibleCommissions
    .filter((c) => c.status === 'pending')
    .reduce((acc, c) => acc + c.commissionAmount, 0);
  const approvedAmount = visibleCommissions
    .filter((c) => c.status === 'approved')
    .reduce((acc, c) => acc + c.commissionAmount, 0);
  const paidAmount = visibleCommissions
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + c.commissionAmount, 0);

  const STATUS_MAP: Record<CommissionStatus, { label: string; badge: string }> = {
    pending: { label: 'قيد المراجعة (Pending)', badge: 'bg-amber-100 text-amber-800' },
    approved: { label: 'معتمدة (Approved)', badge: 'bg-blue-100 text-blue-800' },
    paid: { label: 'تم الصرف (Paid)', badge: 'bg-emerald-100 text-emerald-800' },
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-indigo-600" />
          <span>نظام إدارة عمولات المبيعات (Commissions Management)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {currentUser.role === 'admin'
            ? 'مراجعة واعتماد عمولات فريق المبيعات الناتجة عن إغلاق الصفقات الناجحة (Won Deals)'
            : 'سجل عمولاتك الشخصية المستحقة بناءً على صفقاتك المغلقة'}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي العمولات</span>
            <CircleDollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {totalAmount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">₪</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">لكل الصفقات الرابحة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>قيد المراجعة (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {pendingAmount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">₪</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">بانتظار موافقة الإدارة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>معتمدة (Approved)</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">
            {approvedAmount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">₪</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">معتمدة وجاهزة للتحويل</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-emerald-50/40">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>تم الصرف (Paid)</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {paidAmount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">₪</span>
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">تم تحويلها بنجاح</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">تصفية حسب الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
          >
            <option value="all">الكل</option>
            <option value="pending">قيد المراجعة (Pending)</option>
            <option value="approved">معتمدة (Approved)</option>
            <option value="paid">تم الصرف (Paid)</option>
          </select>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">الموظف:</span>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
            >
              <option value="all">جميع الموظفين</option>
              {users
                .filter((u) => u.role === 'sales')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCommissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            لا توجد عمولات مسجلة مطابقة للشروط الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">الصفقة / العميل</th>
                  <th className="py-3 px-4">موظف المبيعات</th>
                  <th className="py-3 px-4">قيمة الصفقة</th>
                  <th className="py-3 px-4">نسبة العمولة</th>
                  <th className="py-3 px-4">مبلغ العمولة المستحق</th>
                  <th className="py-3 px-4">حالة العمولة</th>
                  <th className="py-3 px-4">تاريخ الإغلاق</th>
                  {currentUser.role === 'admin' && (
                    <th className="py-3 px-4 text-center">إجراءات الإدارة</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCommissions.map((c) => {
                  const st = STATUS_MAP[c.status];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {c.leadTitle}
                        {c.notes && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {c.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {c.salesRepName}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {c.dealValue.toLocaleString()} ₪
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">
                        {c.commissionRate}%
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">
                        {c.commissionAmount.toLocaleString()} ₪
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${st.badge}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500" dir="ltr">
                        {new Date(c.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      {currentUser.role === 'admin' && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {c.status === 'pending' && (
                              <button
                                onClick={() => updateCommissionStatus(c.id, 'approved', 'تم الاعتماد من الإدارة')}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer"
                              >
                                اعتماد
                              </button>
                            )}
                            {c.status === 'approved' && (
                              <button
                                onClick={() => updateCommissionStatus(c.id, 'paid', 'تم تحويل العمولة للحساب')}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer"
                              >
                                صرف العمولة
                              </button>
                            )}
                            {c.status === 'paid' && (
                              <span className="text-emerald-700 font-bold text-[11px]">
                                ✓ تم الصرف
                              </span>
                            )}
                          </div>
                        </td>
                      )}
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
