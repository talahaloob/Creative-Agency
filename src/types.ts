export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  commissionRate: number; // e.g. 10 for 10%
  isActive: boolean;
  createdAt: string;
  password?: string;
}

export type LeadStatus =
  | 'new_lead'       // New Lead - عميل جديد
  | 'contacted'      // Contacted - تم التواصل
  | 'interested'     // Interested - مهتم
  | 'follow_up'      // Follow-up - متابعة مستمرة
  | 'proposal_sent'  // Proposal Sent - تم إرسال العرض
  | 'negotiation'    // Negotiation - مفاوضات
  | 'won'            // Won - صفقة مغلقة (نجاح)
  | 'lost'           // Lost - صفقة خاسرة
  | 'postponed';     // Postponed - مؤجل

export type ContactChannel =
  | 'Call'
  | 'WhatsApp'
  | 'Instagram'
  | 'Facebook'
  | 'In Person'
  | 'Other';

export interface Lead {
  id: string;
  salesRepId: string;
  salesRepName: string;
  companyName: string;       // اسم العميل / الشركة
  contactPerson: string;     // اسم الشخص المسؤول
  phone: string;             // رقم الهاتف
  whatsapp: string;          // واتساب
  city: string;              // المدينة
  businessType: string;      // نوع النشاط التجاري
  source: string;            // مصدر العميل
  service: string;           // الخدمة المهتم بها
  firstContactDate: string;  // تاريخ أول تواصل
  channel: ContactChannel;   // طريقة التواصل
  status: LeadStatus;        // حالة العميل
  nextFollowUpDate: string;  // موعد المتابعة القادمة (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  expectedValue: number;     // قيمة الصفقة المتوقعة
  notes: string;             // ملاحظات
  lastContactDate: string;   // تاريخ آخر تواصل
  createdAt: string;
  updatedAt: string;
  wonDate?: string;
  lostReason?: string;
}

export type CommissionStatus = 'pending' | 'approved' | 'paid';

export interface Commission {
  id: string;
  leadId: string;
  leadTitle: string;
  salesRepId: string;
  salesRepName: string;
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export interface FollowUpLog {
  id: string;
  leadId: string;
  leadTitle: string;
  salesRepId: string;
  salesRepName: string;
  scheduledDate: string;
  completedDate?: string;
  channel: ContactChannel;
  resultNote: string;
  previousStatus: LeadStatus;
  newStatus: LeadStatus;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  leadId?: string;
  leadName?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedBy?: 'phone' | 'company';
  existingLead?: Lead;
}
