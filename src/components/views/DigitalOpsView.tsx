import React, { useState } from 'react';
import { 
  Briefcase, 
  Globe, 
  Bot, 
  Instagram, 
  Palette, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DigitalOpsProject } from '../../types';
import { DIGITAL_OPS_PROJECTS } from '../../data/initialData';
import { playCyberSound } from '../../utils/audio';
import { X } from 'lucide-react';

const SERVICE_ICONS: Record<string, React.ElementType> = {
  WEBSITES: Globe,
  AUTOMATION: Bot,
  SOCIAL_MEDIA: Instagram,
  GRAPHIC_DESIGN: Palette,
  BRANDING: Palette
};

interface DigitalOpsViewProps {
  projects?: DigitalOpsProject[];
  onAddProject?: (project: DigitalOpsProject) => void;
}

export const DigitalOpsView: React.FC<DigitalOpsViewProps> = ({
  projects: externalProjects,
  onAddProject
}) => {
  const [internalProjects] = useState<DigitalOpsProject[]>(DIGITAL_OPS_PROJECTS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [client, setClient] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState<DigitalOpsProject['serviceCategory']>('WEBSITES');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const projects = externalProjects !== undefined ? externalProjects : internalProjects;
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredProjects = projects.filter(
    (p) => selectedCategory === 'ALL' || p.serviceCategory === selectedCategory
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Briefcase size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Digital Operations &amp; Delivery Matrix
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Capacity management &amp; active project delivery pipeline
          </p>
        </div>

        {/* Bandwidth Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <span className={`w-2 h-2 rounded-full ${projects.length === 0 ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
          <span>Capacity: {projects.filter(p => ['DISCOVERY','IN_PROGRESS','REVIEW'].includes(p.status)).length}/4 Active Builds</span>
          {onAddProject && (
            <button
              type="button"
              onClick={() => { playCyberSound('click'); setIsAddOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold"
            >
              <Plus size={14} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Pillars Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'WEBSITES', name: 'Websites & Dev', icon: Globe, count: projects.filter(p => p.serviceCategory === 'WEBSITES').length },
          { id: 'AUTOMATION', name: 'Automation & AI', icon: Bot, count: projects.filter(p => p.serviceCategory === 'AUTOMATION').length },
          { id: 'SOCIAL_MEDIA', name: 'Social Systems', icon: Instagram, count: projects.filter(p => p.serviceCategory === 'SOCIAL_MEDIA').length },
          { id: 'GRAPHIC_DESIGN', name: 'Design & Branding', icon: Palette, count: projects.filter(p => p.serviceCategory === 'GRAPHIC_DESIGN').length }
        ].map((pillar) => {
          const Icon = pillar.icon;
          const isSelected = selectedCategory === pillar.id;

          return (
            <button
              key={pillar.id}
              onClick={() => {
                playCyberSound('click');
                setSelectedCategory(selectedCategory === pillar.id ? 'ALL' : pillar.id);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-black border-black text-white shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300 shadow-2xs hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} strokeWidth={1.75} className={isSelected ? 'text-white' : 'text-zinc-700'} />
                <span className={`text-xs font-bold ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {pillar.count} Active
                </span>
              </div>
              <div className={`text-xs font-bold mt-2.5 ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{pillar.name}</div>
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-zinc-900 flex items-center justify-between">
          <span>ACTIVE CLIENT DELIVERY PIPELINE</span>
          <span className="text-[10px] text-zinc-400 font-normal">{filteredProjects.length} Projects Shown</span>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
            const Icon = SERVICE_ICONS[project.serviceCategory] || Briefcase;
            const isHighCapacity = project.capacityImpact === 'HIGH';

            return (
              <div
                key={project.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between relative transition-all shadow-xs ${
                  isHighCapacity
                    ? 'bg-white border-amber-300 ring-1 ring-amber-300/50'
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div>
                  {/* Project Top */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-900">
                          <Icon size={14} />
                        </div>
                        <h3 className="font-display text-sm font-bold text-zinc-900">{project.client}</h3>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{project.serviceName}</p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-700 font-bold">
                      {project.status}
                    </span>
                  </div>

                  {isHighCapacity && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert size={13} className="shrink-0 text-amber-600" />
                      <span>Moses Notice: High scope density. Protect solo delivery hours.</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="my-3">
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Progress</span>
                      <span className="text-zinc-900 font-bold">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Deliverables Tasks Checklist */}
                  <div className="space-y-1.5 my-3 text-xs">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                      TASKS ({(project.tasks || []).filter(t => t.completed).length}/{(project.tasks || []).length})
                    </span>
                    {(project.tasks || []).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-zinc-700 text-[11px]">
                        <CheckCircle2
                          size={12}
                          className={task.completed ? 'text-zinc-900' : 'text-zinc-300'}
                        />
                        <span className={task.completed ? 'line-through text-zinc-400' : ''}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {project.notes && (
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 italic mb-2">
                      "{project.notes}"
                    </div>
                  )}
                </div>

                {/* Project Bottom */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock size={11} />
                    <span>Due: {project.deadline}</span>
                  </div>

                  <span className="text-xs font-bold text-zinc-900">
                    {project.monthlyRetainer ? `R${project.monthlyRetainer.toLocaleString()} / mo` : 'VALUE UNKNOWN'}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center my-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mb-3">
              <Briefcase size={22} className="text-zinc-500" />
            </div>
            <h3 className="font-display text-base font-bold text-zinc-900">
              Delivery Pipeline Standby
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mt-1 leading-relaxed">
              All project records have been cleared. Operating system is in default clean mode. No project capacity is being consumed.
            </p>
          </div>
        )}
      </div>
      {isAddOpen && onAddProject && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!client.trim() || !serviceName.trim()) return;
            const project: DigitalOpsProject = {
              id: `project-${Date.now()}`,
              client: client.trim(),
              serviceCategory: category,
              serviceName: serviceName.trim(),
              status: 'DISCOVERY',
              progress: 0,
              deadline: deadline.trim() || 'NOT SET',
              tasks: [],
              assetsCount: 0,
              notes: notes.trim() || 'NO NOTES',
              nextAction: nextAction.trim() || 'RESEARCH REQUIRED',
              capacityImpact: 'LOW'
            };
            onAddProject(project);
            setClient(''); setServiceName(''); setDeadline(''); setNotes(''); setNextAction(''); setIsAddOpen(false);
            playCyberSound('boot');
          }} className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-bold">New Client Project</h3><button type="button" onClick={() => setIsAddOpen(false)}><X size={16}/></button></div>
            <input required value={client} onChange={e=>setClient(e.target.value)} placeholder="Client name" className="w-full p-3 rounded-xl border border-zinc-200" />
            <input required value={serviceName} onChange={e=>setServiceName(e.target.value)} placeholder="Service / project name" className="w-full p-3 rounded-xl border border-zinc-200" />
            <select value={category} onChange={e=>setCategory(e.target.value as DigitalOpsProject['serviceCategory'])} className="w-full p-3 rounded-xl border border-zinc-200"><option value="WEBSITES">Websites</option><option value="SOCIAL_MEDIA">Social Media</option><option value="GRAPHIC_DESIGN">Graphic Design</option><option value="AUTOMATION">Automation</option><option value="CLIENT_PROJECTS">Client Projects</option></select>
            <input value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="Deadline (optional)" className="w-full p-3 rounded-xl border border-zinc-200" />
            <textarea value={nextAction} onChange={e=>setNextAction(e.target.value)} placeholder="Next action" className="w-full p-3 rounded-xl border border-zinc-200" />
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" className="w-full p-3 rounded-xl border border-zinc-200" />
            <button className="w-full py-3 rounded-xl bg-black text-white font-semibold">Create Project</button>
          </form>
        </div>
      )}
    </div>
  );
};