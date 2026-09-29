'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NavSection, Lead, StrategicWarning, ChatMessage, LeadStatus, DigitalOpsProject, EmailMessage } from './types';
import { 
  INITIAL_LEADS, 
  INITIAL_WARNINGS, 
  INITIAL_MESSAGES,
  INITIAL_PROJECTS,
  INITIAL_EMAILS
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightIntelligencePanel } from './components/RightIntelligencePanel';
import { CommandPalette } from './components/CommandPalette';

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

  // Play startup sound on initial interaction
  useEffect(() => {
    const handleFirstClick = () => {
      playCyberSound('boot');
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);

  // Wipe all records handler (Default OS Mode)
  const handleWipeAllRecords = useCallback(() => {
    setLeads([]);
    setWarnings([]);
    setProjects([]);
    setEmails([]);
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

  // Lead records are real user-entered data. Persist them locally until a server database is connected.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('moses.leads.v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setLeads(parsed);
      }
    } catch (error) {
      console.warn('MOSES lead storage unavailable:', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('moses.leads.v1', JSON.stringify(leads));
    } catch (error) {
      console.warn('MOSES could not persist lead records:', error);
    }
  }, [leads]);

  // Demo/sample data loading is intentionally disabled. MOSES must never fabricate business records.

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
            leadCount: leads.length,
            hotLeads: leads.filter(l => l.scoreTier === 'HOT').length,
            pipelineValue: leads.reduce((a, c) => a + c.estimatedValue, 0),
            projectsCount: projects.length
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
      // Fallback message
      const activeVal = leads.filter(l => l.status !== 'LOST' && l.status !== 'WON').reduce((a, c) => a + c.estimatedValue, 0);
      const followUps = leads.filter(l => (l.followUpDate || '').includes('Today')).length;
      const targetLead = leads[0];

      const fallbackMsg: ChatMessage = {
        id: `moses-${Date.now()}`,
        sender: 'MOSES',
        text: `Understood, Nate. Operating in high-leverage mode. 

// STRATEGIC ANALYSIS:
${leads.length > 0 
  ? `Pipeline active value is R${activeVal.toLocaleString()} with ${followUps} follow-ups queued.` 
  : `Operating system is in default standby mode with zero active pipeline records.`}

// NEXT IMMEDIATE ACTION:
${targetLead 
  ? `Follow up with ${targetLead.business} using the Skeem concept preview method.` 
  : `Add a target business in Business Development or ask Moses: "Find high-probability prospects".`}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'TACTICAL_EXECUTION',
        structuredResponse: {
          analysis: leads.length > 0
            ? 'Prospects evaluated. High conversion probability on qualified targets.'
            : 'Default clean slate. Ready for new prospect ingestion.',
          plan: leads.length > 0
            ? [
                `Send interactive preview link to ${targetLead?.business || 'lead'}`,
                'Protect solo build capacity (max 4 concurrent retainers)'
              ]
            : [
                'Identify target SMBs with high traffic but poor conversion',
                'Generate free 45-second concept previews (Skeem method)',
                'Cap active builds at 3-4 retainers'
              ],
          action: targetLead 
            ? `Follow up with ${targetLead.business} today.` 
            : 'Add a new prospect or prompt Moses to find leads.'
        }
      };

      setMessages(prev => [...prev, fallbackMsg]);
      setAiState('RESPONDING');
      playCyberSound('response');

      setTimeout(() => {
        setAiState('IDLE');
      }, 3000);
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
            />
          )}

          {activeSection === 'KNOWLEDGE' && <KnowledgeView />}

          {activeSection === 'MEMORY' && <MemoryView />}

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
