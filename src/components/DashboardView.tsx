import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  PhoneCall,
  Sparkles,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  ArrowUpRight,
  Briefcase,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { STATUS_DETAILS } from '../data/constants';
import { Lead } from '../types';

interface DashboardViewProps {
  onSelectLead: (lead: Lead) => void;
  onNavigateTab: (tab: string) => void;
  onOpenNewLead: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectLead,
  onNavigateTab,
  onOpenNewLead,
}) => {
  const { currentUser, leads, users, getEmployeeStats, commissions } = useCrm();
  const [adminFilterUser, setAdminFilterUser] = useState<string>('all');

  if (!currentUser) return null;

  // If currentUser is sales, filter leads to their own, otherwise admin sees all or by selected employee
  const displayedLeads = currentUser.role === 'admin'
    ? (adminFilterUser === 'all' ? leads : leads.filter((l) => l.salesRepId === adminFilterUser))
    : leads.filter((l) => l.salesRepId === currentUser.id);

  // Counts by stages
  const totalCount = displayedLeads.length;
  const newLeadsCount = displayedLeads.filter((l) => l.status === 'new_lead').length;
  const contactedCount = displayedLeads.filter((l) => l.status === 'contacted').length;
  const interestedCount = displayedLeads.filter((l) => l.status === 'interested').length;
  const followUpCount = displayedLeads.filter((l) => l.status === 'follow_up').length;
  const proposalSentCount = displayedLeads.filter((l) => l.status === 'proposal_sent').length;
  const negotiationCount = displayedLeads.filter((l) => l.status === 'negotiation').length;
  const wonCount = displayedLeads.filter((l) => l.status === 'won').length;
  const lostCount = displayedLeads.filter((l) => l.status === 'lost').length;

  // Values
  const totalPipelineValue = displayedLeads.reduce((acc, l) => acc + (l.expectedValue || 0), 0);
  const totalWonValue = displayedLeads
    .filter((l) => l.status === 'won')
    .reduce((acc, l) => acc + (l.expectedValue || 0), 0);

  // Urgent followups: Today & Overdue
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentFollowUps = displayedLeads.filter((l) => {
    if (!l.nextFollowUpDate || l.status === 'won' || l.status === 'lost') return false;
    const dateOnly = l.nextFollowUpDate.split('T')[0];
    return dateOnly <= todayStr;
  });

  // Sales employees performance list (Admin view or team leaderboard)
  const salesUsers = users.filter((u) => u.role === 'sales' && u.isActive);

  // My personal stats if sales rep
  const myStats = getEmployeeStats(currentUser.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>وكالة Creative Agency • نظام إدارة المبيعات</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              أهلاً بك، {currentUser.name}
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              {currentUser.role === 'admin'
                ? 'لوحة إدارة شاملة لمتابعة أداء المبيعات، الصفقات الجارية، واحتساب العمولات (10%) بالشيكل لجميع الموظفين.'
                : `لديك ${displayedLeads.length} عميل مسجل، ومعدل إغلاق صفقات ناجح بنسبة ${myStats.conversionRate}%. استمر في العطاء!`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewLead}
              className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              + تسجيل Lead جديد
            </button>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur transition cursor-pointer"
            >
              عرض مسار الصفقات (Pipeline)
            </button>
          </div>
        </div>

        {/* Decorative ambient circles */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Urgent Follow-up Alert (if any) */}
      {urgentFollowUps.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                تنبيه: يوجد {urgentFollowUps.length} موعد متابعة مستحق اليوم أو متأخر!
              </h4>
              <p className="text-xs text-amber-700">
                العملاء ينتظرون تواصلك لضمان عدم ضياع الفرص البيعية.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('followups')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            عرض جدول المتابعات
          </button>
        </div>
      )}

      {/* Admin Employee Filter */}
      {currentUser.role === 'admin' && (
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs sm:text-sm">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>تصفية إحصائيات لوحة التحكم حسب الموظف:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setAdminFilterUser('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                adminFilterUser === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              جميع الموظفين ({leads.length})
            </button>
            {salesUsers.map((emp) => {
              const empLeadsCount = leads.filter((l) => l.salesRepId === emp.id).length;
              return (
                <button
                  key={emp.id}
                  onClick={() => setAdminFilterUser(emp.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    adminFilterUser === emp.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <img src={emp.avatar} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                  <span>{emp.name}</span>
                  <span className={`text-[10px] px-1 rounded ${adminFilterUser === emp.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {empLeadsCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Stats Cards Grid (Admin specified metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>إجمالي العملاء</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{totalCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">في جميع المراحل</span>
        </div>

        {/* New Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>عملاء جدد (New)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-600 mt-2">{newLeadsCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">بانتظار أول اتصال</span>
        </div>

        {/* Contacted */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>تم التواصل</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{contactedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">تم إجراء الاتصال الأولي</span>
        </div>

        {/* Interested */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>عملاء مهتمون</span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-violet-600 mt-2">{interestedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">فرص بيعية مؤكدة</span>
        </div>

        {/* Follow-up needed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>يحتاجون متابعة</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{followUpCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">متابعة مستمرة</span>
        </div>

        {/* Proposals Sent */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>عروض مرسلة</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{proposalSentCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">بانتظار الموافقة والتعميد</span>
        </div>

        {/* Won Deals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-emerald-50/30">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="text-emerald-800 font-bold">صفقات مغلقة (Won)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{wonCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            بقيمة {totalWonValue.toLocaleString()} ₪
          </span>
        </div>

        {/* Lost Deals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>صفقات خاسرة (Lost)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{lostCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">مؤجل أو لم يتم الاتفاق</span>
        </div>

        {/* Total Pipeline Deals Value */}
        <div className="col-span-2 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-900 text-xs font-bold">
            <span>إجمالي قيمة الفرص المتوقعة</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2">
            {totalPipelineValue.toLocaleString()} <span className="text-xs font-bold text-indigo-700">₪</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-indigo-700 font-medium mt-1">
            <span>المغلق منها: {totalWonValue.toLocaleString()} ₪</span>
            <span>نسبة الإغلاق: {totalPipelineValue ? Math.round((totalWonValue / totalPipelineValue) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Admin Section: Sales Team Performance Leaderboard */}
      {currentUser.role === 'admin' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>أداء فريق المبيعات (Sales Reps Performance)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع عدد العملاء، الصفقات المغلقة، معدل التحويل، والإيرادات المحققة لكل موظف
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('employees')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              إدارة الموظفين ←
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">موظف المبيعات</th>
                  <th className="py-3 px-4">العملاء المسجلون</th>
                  <th className="py-3 px-4">الصفقات المغلقة (Won)</th>
                  <th className="py-3 px-4">نسبة التحويل (Conversion Rate)</th>
                  <th className="py-3 px-4">إجمالي المبيعات</th>
                  <th className="py-3 px-4">نسبة العمولة</th>
                  <th className="py-3 px-4">العمولات المستحقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesUsers.map((rep) => {
                  const stats = getEmployeeStats(rep.id);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rep.avatar}
                            alt={rep.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="block font-bold">{rep.name}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{rep.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {stats.totalLeads} عميل
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {stats.wonCount} صفقات
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">{stats.conversionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {stats.totalRevenue.toLocaleString()} ₪
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">
                        {rep.commissionRate}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">
                        {stats.earnedCommission.toLocaleString()} ₪
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sales Rep Personal Performance Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>ملخص إنجازاتك الشخصية ({currentUser.name})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">العملاء المسجلون باسمك</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{myStats.totalLeads}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium">الصفقات المغلقة بنجاح</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{myStats.wonCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-xs text-indigo-700 font-medium">معدل التحويل (Conversion)</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{myStats.conversionRate}%</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-xs text-purple-700 font-medium">عمولاتك المستحقة (10%)</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {myStats.earnedCommission.toLocaleString()} ₪
              </p>
              <span className="text-[10px] text-purple-500 font-medium mt-0.5 block">
                نسبة عمولتك: {currentUser.commissionRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two columns: Recent Leads & Visual Pipeline Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">أحدث العملاء المسجلين</h3>
            <button
              onClick={() => onNavigateTab('leads')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              عرض الكل ({displayedLeads.length}) ←
            </button>
          </div>

          <div className="space-y-2.5">
            {displayedLeads.slice(0, 5).map((l) => {
              const st = STATUS_DETAILS[l.status] || STATUS_DETAILS.new_lead;
              return (
                <div
                  key={l.id}
                  onClick={() => onSelectLead(l)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{l.companyName}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${st.badgeBg} ${st.badgeText}`}>
                        {st.label.split('(')[0].trim()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {l.contactPerson || 'غير محدد'} • {l.service}
                    </p>
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-extrabold text-slate-800 block">
                      {l.expectedValue ? `${l.expectedValue.toLocaleString()} ₪` : '-'}
                    </span>
                    <span className="text-[10px] text-slate-400">{l.salesRepName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Pipeline Funnel Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">توزيع العملاء على مراحل البيع (Pipeline)</h3>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              فتح لوحة الكانبان ←
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(STATUS_DETAILS).map(([key, item]) => {
              const count = displayedLeads.filter((l) => l.status === key).length;
              const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label.split('(')[0]}</span>
                    <span className="font-bold text-slate-900">
                      {count} عميل ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        key === 'won'
                          ? 'bg-emerald-500'
                          : key === 'lost'
                          ? 'bg-rose-400'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
