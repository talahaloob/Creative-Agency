import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Building2,
  User as UserIcon,
  Phone,
  MessageCircle,
  MapPin,
  Briefcase,
  Layers,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import {
  Lead,
  LeadStatus,
  ContactChannel,
  DuplicateCheckResult,
} from '../types';
import {
  STATUS_DETAILS,
  CONTACT_CHANNELS,
  LEAD_SOURCES,
  CREATIVETECH_SERVICES,
  CITIES,
  BUSINESS_TYPES,
} from '../data/constants';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  leadToEdit,
}) => {
  const { currentUser, users, addLead, updateLead, checkDuplicate } = useCrm();

  const isEditing = !!leadToEdit;

  // Active sales reps list
  const activeSalesUsers = users.filter((u) => u.isActive && (u.role === 'sales' || u.role === 'admin'));

  // Form state
  const [salesRepId, setSalesRepId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [source, setSource] = useState(LEAD_SOURCES[0]);
  const [service, setService] = useState(CREATIVETECH_SERVICES[0]);
  const [firstContactDate, setFirstContactDate] = useState('');
  const [channel, setChannel] = useState<ContactChannel>('Call');
  const [status, setStatus] = useState<LeadStatus>('new_lead');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [expectedValue, setExpectedValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Duplicate check feedback
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult>({
    isDuplicate: false,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (leadToEdit) {
      setSalesRepId(leadToEdit.salesRepId);
      setCompanyName(leadToEdit.companyName);
      setContactPerson(leadToEdit.contactPerson);
      setPhone(leadToEdit.phone);
      setWhatsapp(leadToEdit.whatsapp || leadToEdit.phone);
      setCity(leadToEdit.city || CITIES[0]);
      setBusinessType(leadToEdit.businessType || BUSINESS_TYPES[0]);
      setSource(leadToEdit.source || LEAD_SOURCES[0]);
      setService(leadToEdit.service || CREATIVETECH_SERVICES[0]);
      setFirstContactDate(leadToEdit.firstContactDate || new Date().toISOString().split('T')[0]);
      setChannel(leadToEdit.channel || 'Call');
      setStatus(leadToEdit.status || 'new_lead');
      setNextFollowUpDate(leadToEdit.nextFollowUpDate || '');
      setExpectedValue(leadToEdit.expectedValue || '');
      setNotes(leadToEdit.notes || '');
      setDuplicateWarning({ isDuplicate: false });
    } else {
      // New lead defaults
      const todayStr = new Date().toISOString().split('T')[0];
      setSalesRepId(currentUser?.id || '');
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setWhatsapp('');
      setCity(CITIES[0]);
      setBusinessType(BUSINESS_TYPES[0]);
      setSource(LEAD_SOURCES[0]);
      setService(CREATIVETECH_SERVICES[0]);
      setFirstContactDate(todayStr);
      setChannel('Call');
      setStatus('new_lead');
      setNextFollowUpDate('');
      setExpectedValue('');
      setNotes('');
      setDuplicateWarning({ isDuplicate: false });
    }
    setFormError(null);
  }, [isOpen, leadToEdit, currentUser]);

  // Real-time duplicate validation
  useEffect(() => {
    if (!isOpen) return;
    if ((phone && phone.trim().length >= 7) || (companyName && companyName.trim().length >= 3)) {
      const result = checkDuplicate(phone, companyName, leadToEdit?.id);
      setDuplicateWarning(result);
    } else {
      setDuplicateWarning({ isDuplicate: false });
    }
  }, [phone, companyName, isOpen, leadToEdit]);

  if (!isOpen || !currentUser) return null;

  // Auto-sync WhatsApp if user didn't enter custom one
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsapp || whatsapp === phone) {
      setWhatsapp(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validations
    if (!companyName.trim()) {
      setFormError('يرجى إدخال اسم العميل أو الشركة');
      return;
    }
    if (!phone.trim()) {
      setFormError('يرجى إدخال رقم هاتف العميل');
      return;
    }

    // Strictly forbid saving if duplicate exists
    if (duplicateWarning.isDuplicate && duplicateWarning.existingLead) {
      setFormError(
        `لا يمكن حفظ العميل: مسجل مسبقاً باسم (${duplicateWarning.existingLead.salesRepName})`
      );
      return;
    }

    const assignedUser = users.find((u) => u.id === salesRepId) || currentUser;

    const payload = {
      salesRepId: assignedUser.id,
      salesRepName: assignedUser.name,
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      city,
      businessType,
      source,
      service,
      firstContactDate: firstContactDate || new Date().toISOString().split('T')[0],
      channel,
      status,
      nextFollowUpDate,
      expectedValue: Number(expectedValue) || 0,
      notes: notes.trim(),
      lastContactDate: new Date().toISOString().split('T')[0],
    };

    if (isEditing && leadToEdit) {
      const res = updateLead(leadToEdit.id, payload);
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ أثناء تعديل بيانات العميل');
        return;
      }
    } else {
      const res = addLead(payload);
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ أثناء إضافة العميل');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? 'تعديل بيانات العميل' : 'تسجيل عميل محتمل جديد (Lead)'}
              </h2>
              <p className="text-xs text-indigo-200">
                وكالة Creative Agency • توثيق بيانات التواصل والمتابعة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Prevention Alert Banner */}
        {duplicateWarning.isDuplicate && duplicateWarning.existingLead && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-800">
                  ⚠️ تنبيه منع التكرار: هذا العميل مسجل مسبقاً في النظام!
                </h4>
                <p className="text-xs text-rose-700">
                  تم اكتشاف تطابق في {duplicateWarning.matchedBy === 'phone' ? 'رقم الهاتف' : 'اسم الشركة'}.
                </p>
                <div className="mt-2 bg-white/80 p-2.5 rounded-lg border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">الشركة المسجلة:</span>
                    <span>{duplicateWarning.existingLead.companyName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">الموظف المسؤول عنه:</span>
                    <span className="font-bold text-indigo-700">{duplicateWarning.existingLead.salesRepName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">رقم الهاتف:</span>
                    <span dir="ltr">{duplicateWarning.existingLead.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">حالة العميل الحالية:</span>
                    <span className="font-semibold">{STATUS_DETAILS[duplicateWarning.existingLead.status]?.label}</span>
                  </div>
                </div>
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  للحفاظ على حقوق المبيعات، يرجى التنسيق مع الموظف المسؤول بدلاً من تكرار تسجيل العميل.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Error */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Sales Rep & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Rep */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                موظف المبيعات المسؤول
              </label>
              {currentUser.role === 'admin' ? (
                <select
                  id="lead-sales-rep"
                  value={salesRepId}
                  onChange={(e) => setSalesRepId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                >
                  {activeSalesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'admin' ? 'إدارة' : `عمولة ${u.commissionRate}%`})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (أنت)`}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed"
                />
              )}
            </div>

            {/* Company / Client Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                اسم العميل / الشركة <span className="text-rose-500">*</span>
              </label>
              <input
                id="lead-company-name"
                type="text"
                required
                placeholder="مثال: شركة الأفق للتجارة"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                اسم الشخص المسؤول
              </label>
              <input
                id="lead-contact-person"
                type="text"
                placeholder="مثال: أ. محمد العتيبي - مدير التسويق"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <input
                id="lead-phone"
                type="tel"
                required
                dir="ltr"
                placeholder="05xxxxxxxx أو +9665xxxxxxxx"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-right"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                رقم WhatsApp
              </label>
              <input
                id="lead-whatsapp"
                type="tel"
                dir="ltr"
                placeholder="+9665xxxxxxxx"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-right"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                المدينة
              </label>
              <select
                id="lead-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Business & Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {/* Business Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                نوع النشاط التجاري
              </label>
              <select
                id="lead-business-type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {BUSINESS_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                مصدر العميل
              </label>
              <select
                id="lead-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Interested Service */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                الخدمة المهتم بها (Creative Agency)
              </label>
              <select
                id="lead-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {CREATIVETECH_SERVICES.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Contact Channels & Pipeline Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            {/* First Contact Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                تاريخ أول تواصل
              </label>
              <input
                id="lead-first-contact-date"
                type="date"
                value={firstContactDate}
                onChange={(e) => setFirstContactDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            {/* Communication Channel */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                طريقة التواصل
              </label>
              <select
                id="lead-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as ContactChannel)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              >
                {CONTACT_CHANNELS.map((ch) => (
                  <option key={ch.value} value={ch.value}>
                    {ch.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                حالة العميل (Status)
              </label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
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
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                موعد المتابعة القادمة
              </label>
              <input
                id="lead-next-followup"
                type="datetime-local"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            {/* Expected Value */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                قيمة الصفقة المتوقعة (شيكل ₪)
              </label>
              <div className="relative">
                <input
                  id="lead-expected-value"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="مثال: 75000"
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-12 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-semibold text-slate-800"
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  ₪
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              ملاحظات وتفاصيل الاحتياج
            </label>
            <textarea
              id="lead-notes"
              rows={3}
              placeholder="اكتب أي ملاحظات حول متطلبات العميل أو الميزانية أو ملخص أول مكالمة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              id="submit-lead-btn"
              type="submit"
              disabled={duplicateWarning.isDuplicate}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg shadow-sm transition ${
                duplicateWarning.isDuplicate
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'حفظ التعديلات' : 'تسجيل العميل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
