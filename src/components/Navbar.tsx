import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CalendarClock,
  CircleDollarSign,
  UserCheck,
  History,
  Plus,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewLead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewLead,
}) => {
  const { currentUser, setCurrentUser, users, resetToDemoData, visibleLeads, logout } = useCrm();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!currentUser) return null;

  // Count overdue or today's followups strictly within visible leads
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentFollowupsCount = visibleLeads.filter((l) => {
    if (!l.nextFollowUpDate || l.status === 'won' || l.status === 'lost') return false;
    const dateOnly = l.nextFollowUpDate.split('T')[0];
    return dateOnly <= todayStr;
  }).length;

  const navItems = currentUser.role === 'admin'
    ? [
        { id: 'dashboard', label: 'لوحة القيادة الشاملة', icon: LayoutDashboard },
        { id: 'leads', label: 'كافة العملاء (Leads)', icon: Users },
        { id: 'pipeline', label: 'مسار مبيعات الفريق', icon: KanbanSquare },
        {
          id: 'followups',
          label: 'جدول المتابعات',
          icon: CalendarClock,
          badge: urgentFollowupsCount > 0 ? urgentFollowupsCount : undefined,
        },
        { id: 'commissions', label: 'إدارة العمولات', icon: CircleDollarSign },
        { id: 'employees', label: 'إدارة الفريق والمستخدمين', icon: UserCheck },
        { id: 'audit', label: 'سجل عمليات الفريق', icon: History },
      ]
    : [
        { id: 'dashboard', label: 'لوحة مبيعاتي الخاصة', icon: LayoutDashboard },
        { id: 'leads', label: 'عملائي المحتملين', icon: Users },
        { id: 'pipeline', label: 'مسار صفقاتي', icon: KanbanSquare },
        {
          id: 'followups',
          label: 'مواعيد متابعاتي',
          icon: CalendarClock,
          badge: urgentFollowupsCount > 0 ? urgentFollowupsCount : undefined,
        },
        { id: 'commissions', label: 'عمولاتي الشخصية', icon: CircleDollarSign },
        { id: 'audit', label: 'سجل نشاطاتي', icon: History },
      ];

  const handleReset = () => {
    if (window.confirm('هل تريد استعادة البيانات التجريبية الافتراضية لوكالة Creative Agency؟')) {
      resetToDemoData();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      {/* Top Bar: Brand & Profile Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-slate-900 tracking-tight">Creative Agency</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  CRM
                </span>
                <span className="hidden lg:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  العملة: ₪ | عمولة 10%
                </span>
                {currentUser.role === 'admin' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200">
                    <ShieldCheck className="w-3 h-3 text-purple-700" />
                    لوحة تحكم المدير
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    <Briefcase className="w-3 h-3 text-blue-700" />
                    حساب المندوب: {currentUser.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">نظام إدارة علاقات العملاء ومتابعة الصفقات والعمولات</p>
            </div>
          </div>

          {/* Center / Right controls: Add Lead & User Profile & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="add-lead-top-btn"
              onClick={onOpenNewLead}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-medium shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">عميل جديد</span>
              <span className="sm:hidden">إضافة</span>
            </button>

            {/* Quick User Switcher / Profile Menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-right"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-indigo-200"
                />
                <div className="hidden md:block text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-slate-800">{currentUser.name}</span>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                        مدير عام
                      </span>
                    ) : (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        مندوب ({currentUser.commissionRate}%)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block truncate max-w-[130px]">{currentUser.email}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    {/* User Card Header */}
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                      />
                      <div className="min-w-0 flex-1 text-right">
                        <p className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate" dir="ltr">{currentUser.email}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {currentUser.role === 'admin' ? (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                              مدير النظام (Admin)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                              مندوب مبيعات ({currentUser.commissionRate}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Privacy notice banner */}
                    <div className="px-2.5 py-2 rounded-lg bg-indigo-50/70 border border-indigo-100 mb-2 text-right">
                      <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{currentUser.role === 'admin' ? 'صلاحيات المدير الشاملة' : 'واجهة خصوصية معزولة'}</span>
                      </p>
                      <p className="text-[10px] text-indigo-700 mt-0.5 leading-snug">
                        {currentUser.role === 'admin'
                          ? 'بصفتك مديراً، تتاح لك رؤية جميع العملاء والصفقات ومتابعة أداء كل موظف.'
                          : 'بياناتك وصفقاتك محمية تماماً؛ لا يمكن لأي مندوب آخر رؤيتها.'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-xl transition font-bold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>تسجيل الخروج من الحساب</span>
                        </div>
                        <span className="text-[10px] text-rose-500 font-normal">صفحة الدخول</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleReset();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer text-right"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>استعادة البيانات الافتراضية الأولية</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct Logout Icon Button */}
            <button
              onClick={() => logout()}
              title="تسجيل الخروج"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto py-1.5 scrollbar-none border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Banner Notification */}
      <div className={`px-4 py-1.5 text-center text-xs font-medium border-t ${
        currentUser.role === 'admin'
          ? 'bg-purple-50 text-purple-900 border-purple-100'
          : 'bg-blue-50 text-blue-900 border-blue-100'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          {currentUser.role === 'admin' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>
                <strong>واجهة المدير (Admin):</strong> تشاهد كافة العملاء وإحصائيات جميع الموظفين، إدارة الصلاحيات واعتماد العمولات.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>
                <strong>بوابة المندوب ({currentUser.name}):</strong> تشاهد وتدير العملاء المسجلين بحسابك فقط، ولا يمكنك رؤية عملاء زملائك.
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
