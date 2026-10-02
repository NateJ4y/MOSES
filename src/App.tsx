'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NavSection, Lead, StrategicWarning, ChatMessage, LeadStatus, DigitalOpsProject, EmailMessage, ClientDNA } from './types';
import { 
  INITIAL_LEADS, 
  INITIAL_WARNINGS, 
  INITIAL_MESSAGES,
  INITIAL_PROJECTS,
  INITIAL_EMAILS,
  INITIAL_KNOWLEDGE_DOCS,
  MEMORY_ITEMS
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightIntelligencePanel } from './components/RightIntelligencePanel';
import { CommandPalette } from './components/CommandPalette';
import { BootSequence } from './components/BootSequence';

// Views
import { HomeView } from './components/views/HomeView';
import { CommandFeedView } from './components/views/CommandFeedView';
import { BusinessDevView } from './components/views/BusinessDevView';
import { LeadsView } from './components/views/LeadsView';
import { OutreachView } from './components/views/OutreachView';
import { EmailView } from './components/views/EmailView';
import { WhatsAppView } from './components/views/WhatsAppView';
import { ResearchView } from './components/views/ResearchView';
import { SystemsView } from './components/views/SystemsView';
import { DigitalOpsView } from './components/views/DigitalOpsView';
import { KnowledgeView } from './components/views/KnowledgeView';
import { MemoryView } from './components/views/MemoryView';
import { SettingsView } from './components/views/SettingsView';
import { ClientDNAView } from './components/views/ClientDNAView';

// Audio & Speech
import { playCyberSound } from './utils/audio';
import { speechRecognizer, speakText } from './utils/speech';

export function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('COMMAND');
  const [isHomeMode, setIsHomeMode] = useState<boolean>(true);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [warnings, setWarnings] = useState<StrategicWarning[]>(INITIAL_WARNINGS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [projects, setProjects] = useState<DigitalOpsProject[]>(INITIAL_PROJECTS);
  const [emails, setEmails] = useState<EmailMessage[]>(INITIAL_EMAILS);
  const [clientDNA, setClientDNA] = useState<ClientDNA[]>([]);
  const [outreachTargetLead, setOutreachTargetLead] = useState<Lead | null>(null);

  // AI & Voice State
  const [aiState, setAiState] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'RESPONDING'>('IDLE');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // UI state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hydratedCollections, setHydratedCollections] = useState<Set<string>>(new Set());
  const [isBooting, setIsBooting] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Play startup sound on initial interaction
  useEffect(() => {
    const handleFirstClick = () => {
      playCyberSound('boot');
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);

  const collectionForKey = (key: string) => ({
    'moses.leads.v1': 'leads',
    'moses.projects.v1': 'projects',
    'moses.emails.v1': 'emails',
    'moses.messages.v1': 'messages',
    'moses.clientDNA.v1': 'client_dna'
  } as const)[key];

  const persist = useCallback(async (key: string, value: unknown) => {
    const collection = collectionForKey(key);
    if (!collection) return;
    try {
      const response = await fetch('/api/data?collection=' + collection, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Database write failed.');
      }
    } catch (error) {
      console.warn('MOSES database write failed:', error);
    }
  }, []);

  const restore = useCallback(<T,>(_key: string, fallback: T): T => fallback, []);

  // Wipe all records handler (Default OS Mode)
  const handleWipeAllRecords = useCallback(() => {
    setLeads([]);
    setWarnings([]);
    setProjects([]);
    setEmails([]);
    setClientDNA([]);
    void Promise.all([persist('moses.leads.v1', []), persist('moses.projects.v1', []), persist('moses.emails.v1', []), persist('moses.messages.v1', []), persist('moses.clientDNA.v1', [])]);
    setOutreachTargetLead(null);
    setMessages([
      {
        id: `msg-wipe-${Date.now()}`,
        sender: 'MOSES',
        text: 'All pipeline records, client projects, active warnings, and email records have been wiped. OS is in default clean mode.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'SYSTEM_RESET',
        structuredResponse: {
          analysis: 'Operating system is in default clean mode. All database records cleared.',
          plan: [
            'Add target prospects in Business Development',
            'Command Moses to scan for high-probability targets',
            'Configure service packages and outreach channels'
          ],
          action: 'Standing by for new prospect intake or instructions.'
        }
      }
    ]);
    playCyberSound('boot');
  }, []);

  // Phase 2: hydrate real records from the persistent database. No demo/sample records are loaded.
  // Each collection hydrates independently so one broken table can never wipe another table.
  useEffect(() => {
    let cancelled = false;
    const collections = ['leads', 'projects', 'emails', 'messages', 'client_dna'] as const;

    const load = async () => {
      const results = await Promise.allSettled(collections.map(async (collection) => {
        const response = await fetch('/api/data?collection=' + collection, { cache: 'no-store' });
        if (response.status === 503) return { collection, records: [] };
        const body = await response.json();
        if (!response.ok) throw new Error(collection + ': ' + (body?.error || 'Database read failed.'));
        return { collection, records: Array.isArray(body.records) ? body.records : [] };
      }));

      if (cancelled) return;

      const ready = new Set<string>();
      results.forEach((result, index) => {
        const collection = collections[index];
        if (result.status === 'fulfilled') {
          ready.add(collection);
          const records = result.value.records;
          if (collection === 'leads') setLeads(records as Lead[]);
          if (collection === 'projects') setProjects(records as DigitalOpsProject[]);
          if (collection === 'emails') setEmails(records as EmailMessage[]);
          if (collection === 'messages') setMessages(records as ChatMessage[]);
          if (collection === 'client_dna') setClientDNA(records as ClientDNA[]);
        } else {
          console.warn('MOSES database hydration failed:', result.reason);
        }
      });
      setHydratedCollections(ready);
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (hydratedCollections.has('leads')) persist('moses.leads.v1', leads); }, [leads, persist, hydratedCollections]);
  useEffect(() => { if (hydratedCollections.has('projects')) persist('moses.projects.v1', projects); }, [projects, persist, hydratedCollections]);
  useEffect(() => { if (hydratedCollections.has('emails')) persist('moses.emails.v1', emails); }, [emails, persist, hydratedCollections]);
  useEffect(() => { if (hydratedCollections.has('messages')) persist('moses.messages.v1', messages); }, [messages, persist, hydratedCollections]);
  useEffect(() => { if (hydratedCollections.has('client_dna')) persist('moses.clientDNA.v1', clientDNA); }, [clientDNA, persist, hydratedCollections]);
  // Strategic warnings are derived only from real records.
  useEffect(() => {
    const next: StrategicWarning[] = [];
    const now = new Date();
    const overdue = leads.filter(l => {
      const d = l.followUpDate?.trim();
      return d && d !== 'NOT SET' && /overdue|today/i.test(d);
    });
    if (overdue.length) {
      next.push({
        id: 'derived-follow-up-overdue',
        title: 'FOLLOW-UP ATTENTION',
        code: 'FOLLOW_UP_OVERDUE',
        severity: 'HIGH',
        description: `${overdue.length} real lead record(s) indicate follow-up attention is required.`,
        recommendation: 'Review the affected lead records and complete or reschedule the next action.'
      });
    }
    const activeProjects = projects.filter(p => ['DISCOVERY','IN_PROGRESS','REVIEW'].includes(p.status));
    if (activeProjects.length >= 4) {
      next.push({
        id: 'derived-capacity-risk',
        title: 'CAPACITY RISK',
        code: 'CAPACITY_RISK',
        severity: 'HIGH',
        description: `${activeProjects.length} active project records are currently in delivery.`,
        recommendation: 'Review workload before accepting another high-touch build.'
      });
    }
    if (activeProjects.some(p => p.capacityImpact === 'HIGH')) {
      next.push({
        id: 'derived-project-capacity',
        title: 'HIGH-SCOPE PROJECT',
        code: 'CAPACITY_RISK',
        severity: 'MEDIUM',
        description: 'At least one real project is marked HIGH capacity impact.',
        recommendation: 'Review scope, deadline and task load before committing additional work.'
      });
    }
    setWarnings(next);
    void now;
  }, [leads, projects]);

  // No demo/sample loading is permitted.

  // Handle Voice Input
  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      speechRecognizer.stop();
      setIsListening(false);
      setAiState('IDLE');
    } else {
      setIsListening(true);
      setAiState('LISTENING');
      playCyberSound('blip');

      speechRecognizer.start(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            setIsListening(false);
            setAiState('THINKING');
            handleExecutePrompt(text);
          }
        },
        (error) => {
          console.warn('Speech Recognition error:', error);
          setIsListening(false);
          setAiState('IDLE');
        }
      );
    }
  }, [isListening]);

  // Execute Prompt / Chat with Moses
  const handleExecutePrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    // Switch to Command stream view
    setIsHomeMode(false);
    setActiveSection('COMMAND');
    setIsProcessing(true);
    setAiState('THINKING');

    const userMsgId = `usr-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'NATE',
      text: promptText,
      timestamp
    };

    setMessages(prev => [...prev, newUserMsg]);
    setTranscript('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          context: {
            activeSection,
            leads,
            projects,
            emails,
            clientDNA,
            messages: [...messages, newUserMsg],
            memory: [
              ...MEMORY_ITEMS,
              ...restore('moses.memory.v1', [])
            ],
            knowledge: INITIAL_KNOWLEDGE_DOCS,
            system: {
              leadCount: leads.length,
              projectCount: projects.length,
              emailCount: emails.length,
              clientDNACount: clientDNA.length,
              memoryCount: MEMORY_ITEMS.length,
              knowledgeCount: INITIAL_KNOWLEDGE_DOCS.length
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('API server error');
      }

      const data = await response.json();
      
      const mosesMsg: ChatMessage = {
        id: `moses-${Date.now()}`,
        sender: 'MOSES',
        text: data.reply || "Got it, skeem. Analyzing the data and preparing the next move.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        structuredResponse: data.structuredResponse
      };

      setMessages(prev => [...prev, mosesMsg]);
      setAiState('RESPONDING');
      playCyberSound('response');

      // Speak response if voice is active or short
      if (data.reply) {
        speakText(data.reply);
      }

      setTimeout(() => {
        setAiState('IDLE');
      }, 3000);

    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `moses-${Date.now()}`,
        sender: 'MOSES',
        text: `MOSES Core is unavailable right now. I will not fabricate a business answer to compensate.\\n\\nSTATUS: NOT CONNECTED / ERROR\\n\\nYour local records remain intact. Check the Gemini API configuration or server logs, then retry the command.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'SYSTEM_ERROR',
        structuredResponse: {
          analysis: 'AI response could not be verified.',
          plan: ['Check GEMINI_API_KEY configuration', 'Retry the command', 'Use the relevant OS module directly if urgent'],
          action: 'Reconnect MOSES Core and retry.'
        }
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setAiState('RESPONDING');
      playCyberSound('response');
      setTimeout(() => setAiState('IDLE'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigate = (section: NavSection) => {
    playCyberSound('click');
    if (section === 'HOME') {
      setActiveSection('COMMAND');
      setIsHomeMode(true);
      return;
    }
    if (section === 'COMMAND') {
      setIsHomeMode(false);
      setActiveSection('COMMAND');
      return;
    }
    setActiveSection(section);
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
  };

  const handleSaveClientDNA = (record: ClientDNA) => {
    setClientDNA(prev => prev.some(r => r.id === record.id) ? prev.map(r => r.id === record.id ? record : r) : [record, ...prev]);
  };
  const handleDeleteClientDNA = (id: string) => setClientDNA(prev => prev.filter(r => r.id !== id));

  const handleAddProject = (project: DigitalOpsProject) => {
    setProjects(prev => [project, ...prev]);
  };

  const handleNavigateToOutreachWithLead = (lead: Lead) => {
    setOutreachTargetLead(lead);
    setActiveSection('OUTREACH');
    playCyberSound('click');
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    // Give the dashboard a short settle period before announcing ONLINE.
    window.setTimeout(() => {
      setIsOnline(true);
      playCyberSound('online');
      speakText('Good morning, Nate.');
    }, 2000);
  }, []);

  if (isBooting) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <div className="flex h-screen w-screen bg-white text-zinc-900 overflow-hidden font-sans select-none">
      {/* Desktop & Collapsible Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar
          activeSection={activeSection}
          onNavigate={handleNavigate}
          leadsCount={leads.length}
          warningsCount={warnings.length}
          emailsCount={emails.length}
          projectsCount={projects.length}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Mobile Drawer Sidebar with Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 h-full w-72">
            <Sidebar
              activeSection={activeSection}
              onNavigate={(s) => {
                handleNavigate(s);
                setMobileMenuOpen(false);
              }}
              leadsCount={leads.length}
              warningsCount={warnings.length}
              emailsCount={emails.length}
              projectsCount={projects.length}
              closeMobileMenu={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area + Header */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-radial-grid">
        {/* Header HUD */}
        <Header
          isListening={isListening}
          onToggleVoice={handleToggleVoice}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          mobileMenuOpen={mobileMenuOpen}
          onToggleSidebar={handleToggleSidebar}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          isOnline={isOnline}
          onNavigateHome={() => {
            playCyberSound('click');
            setActiveSection('COMMAND');
            setIsHomeMode(true);
          }}
        />

        {/* View Container */}
        <main className="flex-1 overflow-y-auto relative p-2 sm:p-4 scrollbar-thin">
          {(activeSection === 'COMMAND' || activeSection === 'HOME') && (
            isHomeMode ? (
              <HomeView
                onExecutePrompt={handleExecutePrompt}
                onNavigateTo={handleNavigate}
                isListening={isListening}
                onToggleVoice={handleToggleVoice}
                transcript={transcript}
                leads={leads}
                warnings={warnings}
                projects={projects}
                aiState={aiState}
                isOnline={isOnline}
              />
            ) : (
              <CommandFeedView
                messages={messages}
                onSendMessage={handleExecutePrompt}
                isProcessing={isProcessing}
                isListening={isListening}
                onToggleVoice={handleToggleVoice}
                transcript={transcript}
              />
            )
          )}

          {activeSection === 'BUSINESS_DEVELOPMENT' && (
            <BusinessDevView
              leads={leads}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onAddLead={handleAddLead}
              onNavigateToOutreach={handleNavigateToOutreachWithLead}
            />
          )}

          {activeSection === 'LEADS' && (
            <LeadsView
              leads={leads}
              onNavigateToOutreach={handleNavigateToOutreachWithLead}
              onNavigateToBD={() => setActiveSection('BUSINESS_DEVELOPMENT')}
              onAddLead={handleAddLead}
            />
          )}

          {activeSection === 'OUTREACH' && (
            <OutreachView
              leads={leads}
              initialLead={outreachTargetLead}
            />
          )}

          {activeSection === 'EMAIL' && (
            <EmailView 
              emails={emails}
              onUpdateEmails={setEmails}
            />
          )}

          {activeSection === 'WHATSAPP' && <WhatsAppView />}

          {activeSection === 'RESEARCH' && (
            <ResearchView
              onNavigateToOutreach={() => setActiveSection('OUTREACH')}
              onExecuteMosesCommand={handleExecutePrompt}
            />
          )}

          {activeSection === 'SYSTEMS' && <SystemsView />}

          {activeSection === 'DIGITAL_OPERATIONS' && (
            <DigitalOpsView 
              projects={projects}
              onAddProject={handleAddProject}
            />
          )}

          {activeSection === 'KNOWLEDGE' && <KnowledgeView />}

          {activeSection === 'MEMORY' && <MemoryView />}

          {activeSection === 'CLIENT_DNA' && <ClientDNAView records={clientDNA} onSave={handleSaveClientDNA} onDelete={handleDeleteClientDNA} />}

          {activeSection === 'SETTINGS' && (
            <SettingsView 
              onWipeAllRecords={handleWipeAllRecords}
              leadsCount={leads.length}
              projectsCount={projects.length}
              emailsCount={emails.length}
            />
          )}
        </main>
      </div>

      {/* Right Holographic Strategic Intelligence Panel */}
      <RightIntelligencePanel
        leads={leads}
        warnings={warnings}
        projects={projects}
        isOpen={isRightPanelOpen}
        onClose={() => setIsRightPanelOpen(false)}
        onNavigate={handleNavigate}
        onExecuteMoses={handleExecutePrompt}
        onSelectLead={handleNavigateToOutreachWithLead}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onExecutePrompt={handleExecutePrompt}
        onTriggerVoice={handleToggleVoice}
      />
    </div>
  );
}

export default App;
