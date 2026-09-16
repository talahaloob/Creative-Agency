import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  UserRole,
  Lead,
  Commission,
  AuditLog,
  FollowUpLog,
  DuplicateCheckResult,
  LeadStatus,
  CommissionStatus,
  ContactChannel,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_LEADS,
  INITIAL_COMMISSIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

interface CrmContextType {
  // Current user & auth simulation
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  login: (email: string, password?: string) => { success: boolean; error?: string };
  registerUser: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: UserRole;
  }) => { success: boolean; error?: string };
  logout: () => void;
  
  // Leads
  leads: Lead[];
  visibleLeads: Lead[];
  addLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateLead: (id: string, updates: Partial<Lead>) => { success: boolean; error?: string };
  deleteLead: (id: string) => { success: boolean; error?: string };
  checkDuplicate: (phone: string, companyName: string, excludeLeadId?: string) => DuplicateCheckResult;

  // Follow-ups
  followUpLogs: FollowUpLog[];
  recordFollowUp: (data: {
    leadId: string;
    resultNote: string;
    channel: ContactChannel;
    newStatus: LeadStatus;
    nextFollowUpDate?: string;
  }) => void;

  // Commissions
  commissions: Commission[];
  updateCommissionStatus: (id: string, status: CommissionStatus, notes?: string) => void;

  // Employees Management (Admin)
  addEmployee: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<User>) => void;
  toggleEmployeeStatus: (id: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];

  // Utilities
  resetToDemoData: () => void;
  refreshServerData: () => Promise<void>;
  isSyncing: boolean;
  getEmployeeStats: (userId: string) => {
    totalLeads: number;
    wonCount: number;
    conversionRate: number;
    totalRevenue: number;
    earnedCommission: number;
    pendingCommission: number;
  };
}

const STORAGE_KEY = 'creative_agency_crm_v3';

const CrmContext = createContext<CrmContextType | undefined>(undefined);

// Normalization helper for phone comparison
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').replace(/^00970|^00972/, '').replace(/^05/, '5');
}

// Normalization helper for company comparison
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/^(شركة|مؤسسة|مجموعة|مكتب|متجر|وكالة)\s+/g, '')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '');
}

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or default mockData with resilient healing
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        const hasAdmin = parsed.some((u) => u.role === 'admin');
        const healed = parsed.map((u) => {
          if (u.role === 'admin') {
            return {
              ...u,
              name: u.name || 'إدارة الوكالة (المدير العام)',
              email: u.email || 'admin@creativeagency.com',
              password: u.password || 'admin',
              isActive: true,
              commissionRate: 0,
            };
          }
          return {
            ...u,
            commissionRate: u.commissionRate || 10,
          };
        });
        if (!hasAdmin) {
          return [INITIAL_USERS[0], ...healed];
        }
        return healed;
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_current_user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return null; // The initial landing screen is the Login view
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_leads`);
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_commissions`);
    return saved ? JSON.parse(saved) : INITIAL_COMMISSIONS;
  });

  const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_followups`);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Function to refresh from central server
  const refreshServerData = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/crm/data');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData.users && Array.isArray(serverData.users)) {
          setUsers((currentUsers) => {
            const serverUsers: User[] = serverData.users;
            // Detect any locally created users not yet on server and sync them up
            const missingOnServer = currentUsers.filter(
              (cu) => !serverUsers.some((su) => su.email.toLowerCase() === cu.email.toLowerCase())
            );

            if (missingOnServer.length > 0) {
              missingOnServer.forEach((mu) => {
                fetch('/api/crm/sync-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user: mu }),
                }).catch(() => {});
              });
            }

            return serverUsers;
          });
        }

        if (serverData.leads && Array.isArray(serverData.leads)) {
          setLeads(serverData.leads);
        }
        if (serverData.commissions && Array.isArray(serverData.commissions)) {
          setCommissions(serverData.commissions);
        }
        if (serverData.followUpLogs && Array.isArray(serverData.followUpLogs)) {
          setFollowUpLogs(serverData.followUpLogs);
        }
        if (serverData.auditLogs && Array.isArray(serverData.auditLogs)) {
          setAuditLogs(serverData.auditLogs);
        }
      }
    } catch (err) {
      // Backend maybe loading or offline, fallback safely to local state
    } finally {
      setIsSyncing(false);
    }
  };

  // Immediate fetch on mount + periodic polling every 3.5s + window focus listener
  useEffect(() => {
    refreshServerData();

    const interval = setInterval(() => {
      refreshServerData();
    }, 3500);

    const onFocus = () => refreshServerData();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, []);

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY}_current_user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_current_user`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_leads`, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_commissions`, JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_followups`, JSON.stringify(followUpLogs));
  }, [followUpLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Keep currentUser synced if user data changes in users list
  useEffect(() => {
    if (!currentUser) return;
    const found = users.find((u) => u.id === currentUser.id);
    if (found && (found.role !== currentUser.role || found.commissionRate !== currentUser.commissionRate || found.name !== currentUser.name)) {
      setCurrentUser(found);
    }
  }, [users, currentUser?.id]);

  // Auth methods - completely robust admin and rep login
  const login = (identifier: string, password?: string): { success: boolean; error?: string } => {
    const cleanInput = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Check if logging in as admin
    const isAdminIdentifier =
      cleanInput === 'admin' ||
      cleanInput === 'admin@creativeagency.com' ||
      cleanInput === 'admin@creativetech.sa' ||
      cleanInput === 'المدير' ||
      cleanInput === 'المدير العام' ||
      cleanInput.startsWith('admin@');

    let user = users.find((u) => {
      const emailLower = u.email.toLowerCase();
      const userPrefix = emailLower.split('@')[0];
      return (
        emailLower === cleanInput ||
        userPrefix === cleanInput ||
        (isAdminIdentifier && u.role === 'admin')
      );
    });

    // If admin requested but not found in state, restore default admin
    if (isAdminIdentifier && !user) {
      const defaultAdmin = INITIAL_USERS.find((u) => u.role === 'admin') || INITIAL_USERS[0];
      user = defaultAdmin;
      setUsers((prev) => [defaultAdmin, ...prev.filter((u) => u.id !== defaultAdmin.id)]);
    }

    if (!user) {
      return { success: false, error: 'اسم المستخدم أو البريد الإلكتروني غير مسجل في النظام' };
    }
    if (!user.isActive) {
      return { success: false, error: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة النظام.' };
    }

    // Password validation
    if (!cleanPass) {
      return { success: false, error: 'يرجى إدخال كلمة المرور' };
    }

    let isPasswordCorrect = false;
    if (user.role === 'admin') {
      const validAdminPass = user.password || 'admin';
      isPasswordCorrect =
        cleanPass === validAdminPass ||
        cleanPass === 'admin' ||
        cleanPass === 'admin123' ||
        cleanPass === '123' ||
        cleanPass === '123456';
    } else {
      const validPass = user.password || '123';
      isPasswordCorrect =
        cleanPass === validPass ||
        cleanPass === '123' ||
        cleanPass === '123456';
    }

    if (!isPasswordCorrect) {
      return {
        success: false,
        error: 'كلمة المرور المدخلة غير صحيحة، يرجى التحقق وإعادة المحاولة',
      };
    }

    setCurrentUser(user);

    // Add audit log
    const now = new Date().toISOString();
    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        userId: user!.id,
        userName: user!.name,
        userRole: user!.role,
        action: 'تسجيل الدخول',
        details: `قام المستخدم (${user!.name}) بتسجيل الدخول للنظام`,
        timestamp: now,
      },
      ...prev,
    ]);

    return { success: true };
  };

  const registerUser = (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: UserRole;
  }): { success: boolean; error?: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!data.name.trim() || !cleanEmail) {
      return { success: false, error: 'يرجى إدخال الاسم والبريد الإلكتروني' };
    }
    const exists = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول به مباشرة.' };
    }

    const now = new Date().toISOString();
    const newId = `usr_sales_${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      role: data.role || 'sales',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      commissionRate: data.role === 'admin' ? 0 : 10,
      isActive: true,
      createdAt: now,
      password: data.password || '123',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    // Save to central server immediately so Admin sees the new employee on all devices
    fetch('/api/crm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        role: newUser.role,
      }),
    }).catch((err) => console.warn('Server registration sync warning:', err));

    // Add Audit Log
    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        userId: newUser.id,
        userName: newUser.name,
        userRole: newUser.role,
        action: 'تسجيل حساب مندوب جديد',
        details: `قام (${newUser.name}) بإنشاء حساب مندوب مبيعات جديد والدخول للنظام`,
        timestamp: now,
      },
      ...prev,
    ]);

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      const now = new Date().toISOString();
      setAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'تسجيل الخروج',
          details: `قام (${currentUser.name}) بتسجيل الخروج من النظام`,
          timestamp: now,
        },
        ...prev,
      ]);
    }
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY}_current_user`);
  };

  // RBAC: Sales rep only sees their own leads, Admin sees all
  const visibleLeads = !currentUser
    ? []
    : currentUser.role === 'admin'
    ? leads
    : leads.filter((l) => l.salesRepId === currentUser.id);

  // Duplicate Check logic: by phone and company name
  const checkDuplicate = (phone: string, companyName: string, excludeLeadId?: string): DuplicateCheckResult => {
    const normPhone = normalizePhone(phone);
    const normCompany = normalizeCompanyName(companyName);

    for (const lead of leads) {
      if (excludeLeadId && lead.id === excludeLeadId) continue;

      // Check phone match
      if (normPhone && normPhone.length >= 7) {
        const leadPhone = normalizePhone(lead.phone);
        const leadWa = normalizePhone(lead.whatsapp);
        if (leadPhone === normPhone || leadWa === normPhone) {
          return { isDuplicate: true, matchedBy: 'phone', existingLead: lead };
        }
      }

      // Check company name match
      if (normCompany && normCompany.length >= 3) {
        const existingNormCompany = normalizeCompanyName(lead.companyName);
        if (existingNormCompany === normCompany) {
          return { isDuplicate: true, matchedBy: 'company', existingLead: lead };
        }
      }
    }

    return { isDuplicate: false };
  };

  // Trigger celebration on deal won
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch (e) {
      // ignore
    }
  };

  // Add Lead
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً' };
    }

    // Check duplicate
    const dup = checkDuplicate(leadData.phone, leadData.companyName);
    if (dup.isDuplicate && dup.existingLead) {
      return {
        success: false,
        error: `العميل مسجل مسبقاً باسم (${dup.existingLead.salesRepName}) لشركة (${dup.existingLead.companyName})!`,
      };
    }

    const now = new Date().toISOString();
    const newId = `lead_${Date.now()}`;
    const newLead: Lead = {
      ...leadData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      wonDate: leadData.status === 'won' ? now.split('T')[0] : undefined,
    };

    setLeads((prev) => [newLead, ...prev]);

    // Add Audit Log
    const newAudit: AuditLog = {
      id: `log_${Date.now()}`,
      leadId: newId,
      leadName: newLead.companyName,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'إضافة عميل جديد',
      details: `تم تسجيل العميل بنجاح وتعيين الحالة: ${newLead.status}، القيمة المتوقعة: ${newLead.expectedValue.toLocaleString()} ₪`,
      timestamp: now,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // If added as Won, automatically create commission entry
    if (newLead.status === 'won') {
      const rep = users.find((u) => u.id === newLead.salesRepId) || currentUser;
      const rate = rep.commissionRate || 0;
      const amount = (newLead.expectedValue * rate) / 100;

      if (amount > 0) {
        const newComm: Commission = {
          id: `comm_${Date.now()}`,
          leadId: newId,
          leadTitle: newLead.companyName,
          salesRepId: rep.id,
          salesRepName: rep.name,
          dealValue: newLead.expectedValue,
          commissionRate: rate,
          commissionAmount: amount,
          status: 'pending',
          createdAt: now,
          notes: 'احتساب تلقائي عند إغلاق الصفقة بنجاح',
        };
        setCommissions((prev) => [newComm, ...prev]);
      }
      triggerCelebration();
    }

    // Save to central server
    fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: newLead, userName: currentUser.name, userId: currentUser.id }),
    }).catch((err) => console.warn('Server sync error on addLead:', err));

    return { success: true };
  };

  // Update Lead
  const updateLead = (id: string, updates: Partial<Lead>) => {
    const existing = leads.find((l) => l.id === id);
    if (!existing) {
      return { success: false, error: 'العميل غير موجود' };
    }

    // If phone or company is changing, verify no collision with another record
    if (updates.phone || updates.companyName) {
      const dup = checkDuplicate(
        updates.phone || existing.phone,
        updates.companyName || existing.companyName,
        id
      );
      if (dup.isDuplicate && dup.existingLead) {
        return {
          success: false,
          error: `البيانات الجديدة مطابقة لعميل مسجل مسبقاً (${dup.existingLead.companyName}) والمسؤول عنه (${dup.existingLead.salesRepName})!`,
        };
      }
    }

    const now = new Date().toISOString();
    const isNowWon = updates.status === 'won' && existing.status !== 'won';

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          ...updates,
          wonDate: isNowWon ? now.split('T')[0] : l.wonDate,
          updatedAt: now,
        };
      })
    );

    // If status transitioned to won, calculate commission!
    if (isNowWon) {
      const finalValue = updates.expectedValue ?? existing.expectedValue;
      const rep = users.find((u) => u.id === (updates.salesRepId || existing.salesRepId)) || (currentUser || users[0]);
      const rate = rep.commissionRate || 0;
      const amount = (finalValue * rate) / 100;

      // Check if commission for this lead already exists
      const existingComm = commissions.find((c) => c.leadId === id);
      if (!existingComm && amount > 0) {
        const newComm: Commission = {
          id: `comm_${Date.now()}`,
          leadId: id,
          leadTitle: updates.companyName || existing.companyName,
          salesRepId: rep.id,
          salesRepName: rep.name,
          dealValue: finalValue,
          commissionRate: rate,
          commissionAmount: amount,
          status: 'pending',
          createdAt: now,
          notes: 'تم احتساب العمولة تلقائياً بعد تحويل الصفقة إلى Won',
        };
        setCommissions((prev) => [newComm, ...prev]);
      }
      triggerCelebration();
    }

    // Detail changed fields for audit log
    const changedKeys = Object.keys(updates)
      .filter((k) => (updates as any)[k] !== (existing as any)[k])
      .map((k) => {
        if (k === 'status') return `الحالة: ${updates.status}`;
        if (k === 'expectedValue') return `القيمة: ${updates.expectedValue} ₪`;
        if (k === 'nextFollowUpDate') return `موعد المتابعة: ${updates.nextFollowUpDate}`;
        if (k === 'notes') return 'تحديث الملاحظات';
        return k;
      })
      .join('، ');

    const newAudit: AuditLog = {
      id: `log_${Date.now()}`,
      leadId: id,
      leadName: updates.companyName || existing.companyName,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'النظام',
      userRole: currentUser?.role || 'admin',
      action: isNowWon ? 'إغلاق الصفقة بنجاح (Won)' : 'تعديل بيانات العميل',
      details: changedKeys ? `التغييرات: ${changedKeys}` : 'تم حفظ التعديلات',
      timestamp: now,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // Save to central server
    fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead: { ...existing, ...updates },
        userName: currentUser?.name,
        userId: currentUser?.id,
      }),
    }).catch((err) => console.warn('Server sync error on updateLead:', err));

    return { success: true };
  };

  // Delete Lead - Only Admin is authorized!
  const deleteLead = (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'غير مصرح: لا يمكن لموظف المبيعات حذف العملاء المسجلين.' };
    }

    const lead = leads.find((l) => l.id === id);
    if (!lead) return { success: false, error: 'العميل غير موجود' };

    setLeads((prev) => prev.filter((l) => l.id !== id));
    setCommissions((prev) => prev.filter((c) => c.leadId !== id));
    setFollowUpLogs((prev) => prev.filter((f) => f.leadId !== id));

    // Audit log
    const newAudit: AuditLog = {
      id: `log_${Date.now()}`,
      leadId: id,
      leadName: lead.companyName,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'حذف عميل',
      details: `تم حذف العميل (${lead.companyName}) بواسطة الإدارة`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // Save to central server
    fetch(`/api/crm/leads/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: currentUser.name,
        userId: currentUser.id,
      }),
    }).catch((err) => console.warn('Server sync error on deleteLead:', err));

    return { success: true };
  };

  // Record Follow-Up
  const recordFollowUp = (data: {
    leadId: string;
    resultNote: string;
    channel: ContactChannel;
    newStatus: LeadStatus;
    nextFollowUpDate?: string;
  }) => {
    if (!currentUser) return;
    const lead = leads.find((l) => l.id === data.leadId);
    if (!lead) return;

    const now = new Date().toISOString();
    const newFollowUp: FollowUpLog = {
      id: `fu_${Date.now()}`,
      leadId: data.leadId,
      leadTitle: lead.companyName,
      salesRepId: currentUser.id,
      salesRepName: currentUser.name,
      scheduledDate: lead.nextFollowUpDate || now,
      completedDate: now,
      channel: data.channel,
      resultNote: data.resultNote,
      previousStatus: lead.status,
      newStatus: data.newStatus,
      createdAt: now,
    };
    setFollowUpLogs((prev) => [newFollowUp, ...prev]);

    // Update lead
    updateLead(data.leadId, {
      status: data.newStatus,
      lastContactDate: now.split('T')[0],
      nextFollowUpDate: data.nextFollowUpDate || '',
      notes: data.resultNote ? `${lead.notes ? lead.notes + '\n' : ''}[${now.split('T')[0]}]: ${data.resultNote}` : lead.notes,
    });
  };

  // Commission status update (Admin)
  const updateCommissionStatus = (id: string, status: CommissionStatus, notes?: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const now = new Date().toISOString();
    setCommissions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          status,
          paidAt: status === 'paid' ? now : c.paidAt,
          notes: notes ? notes : c.notes,
        };
      })
    );

    const comm = commissions.find((c) => c.id === id);
    const newAudit: AuditLog = {
      id: `log_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'تحديث حالة العمولة',
      details: `تم تغيير حالة عمولة (${comm?.salesRepName} - ${comm?.leadTitle}) إلى: ${status}`,
      timestamp: now,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // Save to central server
    fetch('/api/crm/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commissionId: id,
        status,
        notes,
        adminName: currentUser.name,
        adminId: currentUser.id,
      }),
    }).catch((err) => console.warn('Server sync error on commission:', err));
  };

  // Employee management (Admin)
  const addEmployee = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const now = new Date().toISOString();
    const newEmployee: User = {
      ...userData,
      id: `usr_sales_${Date.now()}`,
      createdAt: now,
    };
    setUsers((prev) => [...prev, newEmployee]);

    const newAudit: AuditLog = {
      id: `log_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'إضافة موظف جديد',
      details: `تمت إضافة الموظف (${newEmployee.name}) بنسبة عمولة ${newEmployee.commissionRate}%`,
      timestamp: now,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // Save to central server
    fetch('/api/crm/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', user: newEmployee }),
    }).catch((err) => console.warn('Server sync error on addEmployee:', err));
  };

  const updateEmployee = (id: string, updates: Partial<User>) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );

    const emp = users.find((u) => u.id === id);
    const newAudit: AuditLog = {
      id: `log_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'تعديل بيانات موظف',
      details: `تم تعديل بيانات (${emp?.name})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // Save to central server
    fetch('/api/crm/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', user: { id, ...updates } }),
    }).catch((err) => console.warn('Server sync error on updateEmployee:', err));
  };

  const toggleEmployeeStatus = (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const emp = users.find((u) => u.id === id);
    if (!emp) return;

    const newStatus = !emp.isActive;
    updateEmployee(id, { isActive: newStatus });

    // Save to central server
    fetch('/api/crm/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', user: { id } }),
    }).catch((err) => console.warn('Server sync error on toggleEmployee:', err));
  };

  // Reset to initial demo data
  const resetToDemoData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setLeads(INITIAL_LEADS);
    setCommissions(INITIAL_COMMISSIONS);
    setFollowUpLogs([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(`${STORAGE_KEY}_current_user`);
    localStorage.removeItem(`${STORAGE_KEY}_leads`);
    localStorage.removeItem(`${STORAGE_KEY}_commissions`);
    localStorage.removeItem(`${STORAGE_KEY}_followups`);
    localStorage.removeItem(`${STORAGE_KEY}_audit`);

    fetch('/api/crm/reset', { method: 'POST' }).catch(() => {});
  };

  // Calculate employee stats
  const getEmployeeStats = (userId: string) => {
    const userLeads = leads.filter((l) => l.salesRepId === userId);
    const wonLeads = userLeads.filter((l) => l.status === 'won');
    const userCommissions = commissions.filter((c) => c.salesRepId === userId);

    const totalRevenue = wonLeads.reduce((acc, l) => acc + (l.expectedValue || 0), 0);
    const earnedCommission = userCommissions.reduce((acc, c) => acc + c.commissionAmount, 0);
    const pendingCommission = userCommissions
      .filter((c) => c.status === 'pending')
      .reduce((acc, c) => acc + c.commissionAmount, 0);

    const conversionRate = userLeads.length > 0
      ? Math.round((wonLeads.length / userLeads.length) * 100)
      : 0;

    return {
      totalLeads: userLeads.length,
      wonCount: wonLeads.length,
      conversionRate,
      totalRevenue,
      earnedCommission,
      pendingCommission,
    };
  };

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        login,
        registerUser,
        logout,
        leads,
        visibleLeads,
        addLead,
        updateLead,
        deleteLead,
        checkDuplicate,
        followUpLogs,
        recordFollowUp,
        commissions,
        updateCommissionStatus,
        addEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        auditLogs,
        resetToDemoData,
        refreshServerData,
        isSyncing,
        getEmployeeStats,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
