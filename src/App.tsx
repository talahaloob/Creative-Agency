import React, { useState, useEffect } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { PipelineView } from './components/PipelineView';
import { FollowUpsView } from './components/FollowUpsView';
import { CommissionsView } from './components/CommissionsView';
import { EmployeesView } from './components/EmployeesView';
import { AuditLogView } from './components/AuditLogView';
import { LeadModal } from './components/LeadModal';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { FollowUpModal } from './components/FollowUpModal';
import { Lead } from './types';

function CrmAppContent() {
  const { currentUser } = useCrm();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // If user is sales rep, prevent access to employees tab
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentTab === 'employees') {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // If not logged in, render the Login / Register screen
  if (!currentUser) {
    return <LoginView />;
  }

  // Handlers
  const handleOpenNewLead = () => {
    setLeadToEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsLeadModalOpen(true);
    // If details modal was open, close it or keep
    setIsDetailsModalOpen(false);
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
    setIsDetailsModalOpen(true);
  };

  const handleOpenFollowUp = (lead: Lead) => {
    setSelectedLeadForFollowUp(lead);
    setIsFollowUpModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewLead={handleOpenNewLead}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            onSelectLead={handleSelectLead}
            onNavigateTab={setCurrentTab}
            onOpenNewLead={handleOpenNewLead}
          />
        )}

        {currentTab === 'leads' && (
          <LeadsView
            onSelectLead={handleSelectLead}
            onOpenNewLead={handleOpenNewLead}
            onEditLead={handleOpenEditLead}
          />
        )}

        {currentTab === 'pipeline' && (
          <PipelineView
            onSelectLead={handleSelectLead}
            onOpenNewLead={handleOpenNewLead}
          />
        )}

        {currentTab === 'followups' && (
          <FollowUpsView
            onSelectLead={handleSelectLead}
            onOpenFollowUpModal={handleOpenFollowUp}
          />
        )}

        {currentTab === 'commissions' && <CommissionsView />}

        {currentTab === 'employees' && <EmployeesView />}

        {currentTab === 'audit' && <AuditLogView />}
      </main>

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        leadToEdit={leadToEdit}
      />

      <LeadDetailsModal
        isOpen={isDetailsModalOpen}
        lead={selectedLeadForDetails}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleOpenEditLead}
        onOpenFollowUp={handleOpenFollowUp}
      />

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        lead={selectedLeadForFollowUp}
        onClose={() => setIsFollowUpModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>نظام CRM الداخلي لوكالة Creative Agency • العملة: شيكل (₪) • نسبة العمولة: 10%</span>
          <span className="text-slate-400">إصدار الوكالة الرقمية 2.5 • حماية وخصوصية تامة</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CrmProvider>
      <CrmAppContent />
    </CrmProvider>
  );
}
