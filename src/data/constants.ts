import { LeadStatus, ContactChannel } from '../types';

export const STATUS_DETAILS: Record<LeadStatus, {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  columnBg: string;
  order: number;
}> = {
  new_lead: {
    label: 'عميل جديد (New Lead)',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700 border border-sky-200',
    borderColor: 'border-sky-400',
    columnBg: 'bg-sky-50/50',
    order: 1,
  },
  contacted: {
    label: 'تم التواصل (Contacted)',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border border-blue-200',
    borderColor: 'border-blue-400',
    columnBg: 'bg-blue-50/50',
    order: 2,
  },
  interested: {
    label: 'مهتم (Interested)',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700 border border-indigo-200',
    borderColor: 'border-indigo-400',
    columnBg: 'bg-indigo-50/50',
    order: 3,
  },
  follow_up: {
    label: 'متابعة مستمرة (Follow-up)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700 border border-amber-200',
    borderColor: 'border-amber-400',
    columnBg: 'bg-amber-50/50',
    order: 4,
  },
  proposal_sent: {
    label: 'تم إرسال العرض (Proposal Sent)',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700 border border-purple-200',
    borderColor: 'border-purple-400',
    columnBg: 'bg-purple-50/50',
    order: 5,
  },
  negotiation: {
    label: 'مفاوضات (Negotiation)',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700 border border-violet-200',
    borderColor: 'border-violet-500',
    columnBg: 'bg-violet-50/50',
    order: 6,
  },
  won: {
    label: 'صفقة مغلقة - رابحة (Won)',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border border-emerald-200',
    borderColor: 'border-emerald-500',
    columnBg: 'bg-emerald-50/50',
    order: 7,
  },
  lost: {
    label: 'صفقة خاسرة (Lost)',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700 border border-rose-200',
    borderColor: 'border-rose-400',
    columnBg: 'bg-rose-50/50',
    order: 8,
  },
  postponed: {
    label: 'مؤجل (Postponed)',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 border border-slate-200',
    borderColor: 'border-slate-400',
    columnBg: 'bg-slate-50',
    order: 9,
  },
};

export const CONTACT_CHANNELS: { value: ContactChannel; label: string }[] = [
  { value: 'Call', label: 'اتصال هاتفي (Call)' },
  { value: 'WhatsApp', label: 'واتساب (WhatsApp)' },
  { value: 'Instagram', label: 'إنستغرام (Instagram)' },
  { value: 'Facebook', label: 'فيسبوك (Facebook)' },
  { value: 'In Person', label: 'زيارة شخصية (In Person)' },
  { value: 'Other', label: 'أخرى (Other)' },
];

export const LEAD_SOURCES = [
  'الموقع الإلكتروني',
  'إحالة من عميل سابق (Referral)',
  'إعلانات جوجل وسوشيال ميديا',
  'معرض ومؤتمر أعمال',
  'اتصال مباشر (Cold Call)',
  'لينكد إن (LinkedIn)',
  'واتساب للأعمال',
  'أخرى',
];

export const CURRENCY_SYMBOL = '₪';
export const CURRENCY_NAME = 'شيكل';

export const formatShekel = (amount: number): string => {
  return `${(amount || 0).toLocaleString()} ₪`;
};

export const CREATIVE_AGENCY_SERVICES = [
  'تصميم هوية بصرية وعلامة تجارية متكاملة',
  'إدارة الحملات الإعلانية والتسويق الرقمي',
  'صناعة المحتوى وإدارة منصات التواصل الاجتماعي',
  'تصميم وتطوير مواقع الويب والمتاجر الإلكترونية',
  'إنتاج الفيديو والموشن جرافيك والتصوير الاحترافي',
  'تصميم واجهات وتجربة المستخدم (UI/UX)',
  'تحسين محركات البحث (SEO) والظهور الرقمي',
  'استشارات التسويق ونمو المبيعات',
];

// Keep alias for backwards compatibility
export const CREATIVETECH_SERVICES = CREATIVE_AGENCY_SERVICES;

export const CITIES = [
  'القدس',
  'رام الله والبيرة',
  'نابلس',
  'الخليل',
  'بيت لحم',
  'جنين',
  'طولكرم',
  'قلقيلية',
  'أريحا',
  'غزة',
  'يافا',
  'حيفا',
  'الناصرة',
  'عمان',
  'الرياض',
  'دبي',
];

export const BUSINESS_TYPES = [
  'تقنية وبرمجيات',
  'تجارة إلكترونية وتجزئة',
  'عقارات واستثمار',
  'مقاولات وهندسة',
  'صحة وعيادات طبية',
  'مطاعم وضيافة',
  'تعليم وتدريب',
  'شحن ولوجستيات',
  'خدمات مالية واستشارية',
  'تصنيع وإنتاج',
];
