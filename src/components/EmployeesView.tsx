import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Edit,
  ShieldCheck,
  Briefcase,
  Phone,
  Mail,
  Percent,
  CheckCircle,
  XCircle,
  Award,
  X,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { User, UserRole } from '../types';

export const EmployeesView: React.FC = () => {
  const {
    users,
    currentUser,
    addEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    getEmployeeStats,
    refreshServerData,
    isSyncing,
  } = useCrm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [error, setError] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">صلاحية محصورة بالإدارة</h3>
        <p className="text-xs text-slate-500 mt-1">
          صفحة إدارة فريق المبيعات والعمولات متاحة لحسابات المدير (Admin) فقط.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('123456');
    setPhone('');
    setRole('sales');
    setCommissionRate(10);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || '123456');
    setPhone(u.phone);
    setRole(u.role);
    setCommissionRate(u.commissionRate);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('يرجى كتابة الاسم والبريد الإلكتروني');
      return;
    }

    if (editingUser) {
      const updates: Partial<User> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        commissionRate: Number(commissionRate) || 0,
      };
      if (password.trim()) {
        updates.password = password.trim();
      }
      updateEmployee(editingUser.id, updates);
    } else {
      addEmployee({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || '123456',
        phone: phone.trim(),
        role,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        commissionRate: Number(commissionRate) || 0,
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>إدارة فريق المبيعات (Sales Team Management)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة وتعديل بيانات الموظفين، تحديد نسب العمولات، وتفعيل أو تعطيل الحسابات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshServerData()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 disabled:opacity-50"
            title="تحديث قائمة الموظفين والحسابات المسجلة من السيرفر فوراً"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncing ? 'جاري المزامنة...' : 'تحديث فوري للسيرفر'}</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {users.length}
            </span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((emp) => {
          const stats = getEmployeeStats(emp.id);
          return (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition ${
                emp.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Profile Bar */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
                      {emp.role === 'admin' ? (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                          مدير (Admin)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                          مبيعات ({emp.commissionRate}%)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{emp.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400 block" dir="ltr">
                        {emp.phone}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span>{emp.password || '123456'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition cursor-pointer"
                    title="تعديل الموظف"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">العملاء</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{stats.totalLeads}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] text-emerald-700 block">المغلقة</span>
                  <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block">{stats.wonCount}</span>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <span className="text-[10px] text-indigo-700 block">التحويل</span>
                  <span className="text-sm font-extrabold text-indigo-600 mt-0.5 block">{stats.conversionRate}%</span>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <span className="text-[10px] text-purple-700 block">المبيعات</span>
                  <span className="text-xs font-extrabold text-purple-900 mt-0.5 block truncate">
                    {stats.totalRevenue > 0 ? `${(stats.totalRevenue / 1000).toFixed(0)}k` : '0'}
                  </span>
                </div>
              </div>

              {/* Status and Commission Rate controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">الحالة:</span>
                  <button
                    onClick={() => toggleEmployeeStatus(emp.id)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      emp.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {emp.isActive ? 'مفعل (نشط)' : 'معطل'}
                  </button>
                </div>

                {emp.role === 'sales' && (
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    <span>نسبة العمولة: <strong>{emp.commissionRate}%</strong></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-800 to-purple-800 text-white">
              <h3 className="text-base font-bold">
                {editingUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg transition"
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف الشمري"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="user@creativetech.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="+9665xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور لتسجيل الدخول {editingUser && '(اترك فارغاً للإبقاء على الحالية)'}
                </label>
                <input
                  type="text"
                  placeholder={editingUser ? 'اترك فارغاً أو اكتب كلمة مرور جديدة' : 'مثال: 123456'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  >
                    <option value="sales">موظف مبيعات (Sales)</option>
                    <option value="admin">مدير عام (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نسبة العمولة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
