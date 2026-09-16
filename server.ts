import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_USERS, INITIAL_LEADS, INITIAL_COMMISSIONS, INITIAL_AUDIT_LOGS } from './src/data/mockData';
import { User, Lead, Commission, FollowUpLog, AuditLog } from './src/types';

interface DatabaseSchema {
  users: User[];
  leads: Lead[];
  commissions: Commission[];
  followUpLogs: FollowUpLog[];
  auditLogs: AuditLog[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDbDirectory();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data: DatabaseSchema = JSON.parse(raw);
      
      // Resilient check: always guarantee admin account exists
      const hasAdmin = data.users.some((u) => u.role === 'admin');
      if (!hasAdmin) {
        data.users.unshift(INITIAL_USERS[0]);
        saveDatabase(data);
      }
      return data;
    } catch (err) {
      console.error('Error reading db.json, re-initializing with seed data:', err);
    }
  }

  const initialData: DatabaseSchema = {
    users: INITIAL_USERS,
    leads: INITIAL_LEADS,
    commissions: INITIAL_COMMISSIONS,
    followUpLogs: [],
    auditLogs: INITIAL_AUDIT_LOGS,
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    ensureDbDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to db.json:', err);
  }
}

// In-memory cache synced with disk
let db = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Get full CRM data
  app.get('/api/crm/data', (req, res) => {
    res.json({
      users: db.users,
      leads: db.leads,
      commissions: db.commissions,
      followUpLogs: db.followUpLogs,
      auditLogs: db.auditLogs,
    });
  });

  // Register new Sales Rep / User
  app.post('/api/crm/register', (req, res) => {
    const { name, email, phone, password, role } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال الاسم والبريد الإلكتروني' });
    }

    const exists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول به مباشرة.',
      });
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_sales_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      email: cleanEmail,
      phone: (phone || '').trim(),
      role: (role === 'admin' ? 'admin' : 'sales'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      commissionRate: role === 'admin' ? 0 : 10,
      isActive: true,
      createdAt: now,
      password: password || '123',
    };

    db.users.push(newUser);

    // Audit log
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'تسجيل حساب مندوب جديد',
      details: `قام (${newUser.name}) بإنشاء حساب مندوب مبيعات جديد في النظام بنجاح`,
      timestamp: now,
    });

    saveDatabase(db);
    return res.json({ success: true, user: newUser });
  });

  // Sync user (for offline or local accounts to propagate to server)
  app.post('/api/crm/sync-user', (req, res) => {
    const { user } = req.body;
    if (!user || !user.email) {
      return res.status(400).json({ success: false, error: 'Invalid user data' });
    }

    const cleanEmail = user.email.trim().toLowerCase();
    const exists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!exists) {
      db.users.push({
        ...user,
        email: cleanEmail,
        isActive: user.isActive !== false,
        commissionRate: user.commissionRate || 10,
      });

      db.auditLogs.unshift({
        id: `log_sync_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role || 'sales',
        action: 'مزامنة حساب موظف',
        details: `تمت مزامنة حساب الموظف (${user.name}) مع الخادم المركزي`,
        timestamp: new Date().toISOString(),
      });

      saveDatabase(db);
      return res.json({ success: true, synced: true, user });
    }

    return res.json({ success: true, synced: false, user: exists });
  });

  // Save / Update User (Employee Management)
  app.post('/api/crm/users', (req, res) => {
    const { action, user } = req.body;
    if (!user) {
      return res.status(400).json({ success: false, error: 'User data required' });
    }

    const now = new Date().toISOString();

    if (action === 'add') {
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const exists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return res.status(400).json({ success: false, error: 'البريد الإلكتروني مسجل مسبقاً' });
      }

      const newUser: User = {
        ...user,
        id: user.id || `usr_sales_${Date.now()}`,
        email: cleanEmail,
        createdAt: now,
        commissionRate: user.role === 'admin' ? 0 : (user.commissionRate || 10),
        isActive: true,
      };

      db.users.push(newUser);
      db.auditLogs.unshift({
        id: `log_${Date.now()}`,
        userId: 'usr_admin',
        userName: 'إدارة الوكالة',
        userRole: 'admin',
        action: 'إضافة موظف جديد',
        details: `تمت إضافة الموظف (${newUser.name}) بنسبة عمولة ${newUser.commissionRate}%`,
        timestamp: now,
      });
    } else if (action === 'update') {
      const idx = db.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        db.users[idx] = {
          ...db.users[idx],
          ...user,
        };
        db.auditLogs.unshift({
          id: `log_${Date.now()}`,
          userId: 'usr_admin',
          userName: 'إدارة الوكالة',
          userRole: 'admin',
          action: 'تعديل بيانات موظف',
          details: `تم تحديث بيانات الموظف (${user.name})`,
          timestamp: now,
        });
      }
    } else if (action === 'toggle') {
      const target = db.users.find((u) => u.id === user.id);
      if (target) {
        target.isActive = !target.isActive;
        db.auditLogs.unshift({
          id: `log_${Date.now()}`,
          userId: 'usr_admin',
          userName: 'إدارة الوكالة',
          userRole: 'admin',
          action: target.isActive ? 'تفعيل حساب موظف' : 'تعطيل حساب موظف',
          details: `تم ${target.isActive ? 'تفعيل' : 'تعطيل'} حساب الموظف (${target.name})`,
          timestamp: now,
        });
      }
    }

    saveDatabase(db);
    return res.json({ success: true, users: db.users });
  });

  // Save / Update Lead
  app.post('/api/crm/leads', (req, res) => {
    const { lead, userName, userId } = req.body;
    if (!lead) {
      return res.status(400).json({ success: false, error: 'Lead data required' });
    }

    const now = new Date().toISOString();
    const existingIndex = db.leads.findIndex((l) => l.id === lead.id);

    if (existingIndex !== -1) {
      const prevLead = db.leads[existingIndex];
      const updatedLead: Lead = {
        ...lead,
        updatedAt: now,
      };

      // Check if status changed to 'won'
      if (updatedLead.status === 'won' && prevLead.status !== 'won') {
        updatedLead.wonDate = now.split('T')[0];

        // Find sales rep commission rate
        const rep = db.users.find((u) => u.id === updatedLead.salesRepId);
        const rate = rep?.commissionRate ?? 10;
        const dealVal = updatedLead.expectedValue || 0;
        const commAmount = Math.round((dealVal * rate) / 100);

        const newCommission: Commission = {
          id: `comm_${Date.now()}`,
          leadId: updatedLead.id,
          leadTitle: updatedLead.companyName,
          salesRepId: updatedLead.salesRepId,
          salesRepName: updatedLead.salesRepName,
          dealValue: dealVal,
          commissionRate: rate,
          commissionAmount: commAmount,
          status: 'pending',
          createdAt: now,
          notes: `عمولة مستحقة بنسبة ${rate}% بعد إتمام الصفقة بنجاح`,
        };

        db.commissions.unshift(newCommission);

        db.auditLogs.unshift({
          id: `log_comm_${Date.now()}`,
          leadId: updatedLead.id,
          leadName: updatedLead.companyName,
          userId: userId || 'system',
          userName: userName || 'النظام',
          userRole: 'sales',
          action: 'إغلاق صفقة ناجحة (Won)',
          details: `تم إغلاق صفقة (${updatedLead.companyName}) بنجاح بقيمة ${dealVal.toLocaleString()} ₪ واحتساب عمولة ${commAmount.toLocaleString()} ₪ (${rate}%)`,
          timestamp: now,
        });
      }

      db.leads[existingIndex] = updatedLead;

      db.auditLogs.unshift({
        id: `log_${Date.now()}`,
        leadId: updatedLead.id,
        leadName: updatedLead.companyName,
        userId: userId || 'system',
        userName: userName || 'مستخدم',
        userRole: 'sales',
        action: 'تحديث بيانات العميل',
        details: `قام (${userName || 'المستخدم'}) بتحديث بيانات العميل (${updatedLead.companyName})`,
        timestamp: now,
      });

      saveDatabase(db);
      return res.json({ success: true, lead: updatedLead, commissions: db.commissions, auditLogs: db.auditLogs });
    } else {
      // New lead
      const newLead: Lead = {
        ...lead,
        id: lead.id || `lead_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };

      db.leads.unshift(newLead);

      db.auditLogs.unshift({
        id: `log_${Date.now()}`,
        leadId: newLead.id,
        leadName: newLead.companyName,
        userId: userId || 'system',
        userName: userName || 'مستخدم',
        userRole: 'sales',
        action: 'إضافة عميل جديد',
        details: `قام (${userName || 'المستخدم'}) بإضافة العميل الجديد (${newLead.companyName}) بقيمة متوقعة ${Number(newLead.expectedValue || 0).toLocaleString()} ₪`,
        timestamp: now,
      });

      saveDatabase(db);
      return res.json({ success: true, lead: newLead, commissions: db.commissions, auditLogs: db.auditLogs });
    }
  });

  // Delete lead
  app.delete('/api/crm/leads/:id', (req, res) => {
    const leadId = req.params.id;
    const { userName, userId } = req.body || {};

    const target = db.leads.find((l) => l.id === leadId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'العميل غير موجود' });
    }

    db.leads = db.leads.filter((l) => l.id !== leadId);

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      leadName: target.companyName,
      userId: userId || 'usr_admin',
      userName: userName || 'إدارة الوكالة',
      userRole: 'admin',
      action: 'حذف عميل',
      details: `تم حذف العميل (${target.companyName}) من النظام`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.json({ success: true });
  });

  // Update commission status
  app.post('/api/crm/commissions', (req, res) => {
    const { commissionId, status, notes, adminName, adminId } = req.body;
    const comm = db.commissions.find((c) => c.id === commissionId);
    if (!comm) {
      return res.status(404).json({ success: false, error: 'العمولة غير موجودة' });
    }

    const now = new Date().toISOString();
    comm.status = status;
    if (notes) comm.notes = notes;
    if (status === 'paid') {
      comm.paidAt = now;
    }

    const statusLabels: Record<string, string> = {
      approved: 'اعتماد عمولة',
      paid: 'صرف عمولة',
      pending: 'إعادة العمولة للمراجعة',
    };

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      leadName: comm.leadTitle,
      userId: adminId || 'usr_admin',
      userName: adminName || 'إدارة الوكالة',
      userRole: 'admin',
      action: statusLabels[status] || 'تحديث حالة العمولة',
      details: `تم تغيير حالة عمولة (${comm.salesRepName}) للصفقة (${comm.leadTitle}) إلى [${status}] بقيمة ${comm.commissionAmount.toLocaleString()} ₪`,
      timestamp: now,
    });

    saveDatabase(db);
    return res.json({ success: true, commission: comm });
  });

  // Log follow-up
  app.post('/api/crm/followups', (req, res) => {
    const { followUpLog } = req.body;
    if (!followUpLog) {
      return res.status(400).json({ success: false, error: 'Follow-up log required' });
    }

    const newLog: FollowUpLog = {
      ...followUpLog,
      id: followUpLog.id || `flog_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    db.followUpLogs.unshift(newLog);

    // Also update lead's lastContactDate and channel if present
    const lead = db.leads.find((l) => l.id === newLog.leadId);
    if (lead) {
      lead.lastContactDate = new Date().toISOString().split('T')[0];
      lead.status = newLog.newStatus;
      lead.channel = newLog.channel;
      lead.updatedAt = new Date().toISOString();
    }

    saveDatabase(db);
    return res.json({ success: true, followUpLog: newLog });
  });

  // Reset demo data
  app.post('/api/crm/reset', (req, res) => {
    db = {
      users: INITIAL_USERS,
      leads: INITIAL_LEADS,
      commissions: INITIAL_COMMISSIONS,
      followUpLogs: [],
      auditLogs: INITIAL_AUDIT_LOGS,
    };
    saveDatabase(db);
    return res.json({ success: true, data: db });
  });

  // Vite middleware for development vs Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Creative Agency Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
