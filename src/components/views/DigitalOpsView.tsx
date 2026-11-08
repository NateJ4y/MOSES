import React, { useMemo, useState } from 'react';
import {
  Briefcase, Globe, Bot, Instagram, Palette, Clock, CheckCircle2,
  AlertTriangle, ShieldAlert, Plus, Pencil, Trash2, ChevronDown,
  ChevronUp, X, CalendarDays, ListTodo, ArrowRight, Save
} from 'lucide-react';
import { DigitalOpsProject } from '../../types';
import { playCyberSound } from '../../utils/audio';

const SERVICE_ICONS: Record<string, React.ElementType> = {
  WEBSITES: Globe,
  AUTOMATION: Bot,
  SOCIAL_MEDIA: Instagram,
  GRAPHIC_DESIGN: Palette,
  BRANDING: Palette,
  CLIENT_PROJECTS: Briefcase
};

type ProjectTask = DigitalOpsProject['tasks'][number];
type ProjectStatus = DigitalOpsProject['status'];

interface DigitalOpsViewProps {
  projects: DigitalOpsProject[];
  onAddProject: (project: DigitalOpsProject) => void;
  onUpdateProject: (project: DigitalOpsProject) => void;
  onDeleteProject: (projectId: string) => void;
  writeError?: string | null;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave?: () => void;
  onReload?: () => void;
}

const emptyDraft = () => ({
  client: '', serviceName: '', serviceCategory: 'WEBSITES' as DigitalOpsProject['serviceCategory'],
  status: 'DISCOVERY' as ProjectStatus, deadline: '', progress: 0,
  monthlyRetainer: '', notes: '', nextAction: '', capacityImpact: 'LOW' as DigitalOpsProject['capacityImpact']
});

const dateValue = (value?: string) => {
  if (!value || value === 'NOT SET') return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
};

export const DigitalOpsView: React.FC<DigitalOpsViewProps> = ({
  projects, onAddProject, onUpdateProject, onDeleteProject,
  writeError, saveStatus = 'idle', onRetrySave, onReload
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<DigitalOpsProject | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [taskDraft, setTaskDraft] = useState('');
  const [taskDateDraft, setTaskDateDraft] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DigitalOpsProject | null>(null);

  const activeCount = projects.filter(p => ['DISCOVERY', 'IN_PROGRESS', 'REVIEW'].includes(p.status)).length;
  const filteredProjects = useMemo(
    () => projects.filter(p => selectedCategory === 'ALL' || p.serviceCategory === selectedCategory),
    [projects, selectedCategory]
  );

  const openCreate = () => {
    setDraft(emptyDraft());
    setEditingProject(null);
    setIsCreating(true);
  };

  const openEdit = (project: DigitalOpsProject) => {
    setDraft({
      client: project.client || '',
      serviceName: project.serviceName || '',
      serviceCategory: project.serviceCategory || 'WEBSITES',
      status: project.status || 'DISCOVERY',
      deadline: dateValue(project.deadline),
      progress: Math.max(0, Math.min(100, Number(project.progress) || 0)),
      monthlyRetainer: project.monthlyRetainer == null ? '' : String(project.monthlyRetainer),
      notes: project.notes === 'NO NOTES' ? '' : (project.notes || ''),
      nextAction: project.nextAction === 'RESEARCH REQUIRED' ? '' : (project.nextAction || ''),
      capacityImpact: project.capacityImpact || 'LOW'
    });
    setEditingProject(project);
    setIsCreating(false);
  };

  const saveProject = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.client.trim() || !draft.serviceName.trim()) return;
    const base = editingProject;
    const project: DigitalOpsProject = {
      id: base?.id || 'project-' + Date.now(),
      client: draft.client.trim(),
      serviceName: draft.serviceName.trim(),
      serviceCategory: draft.serviceCategory,
      status: draft.status,
      progress: Math.max(0, Math.min(100, Number(draft.progress) || 0)),
      deadline: draft.deadline || 'NOT SET',
      monthlyRetainer: draft.monthlyRetainer.trim() ? Number(draft.monthlyRetainer) : undefined,
      tasks: base?.tasks || [],
      assetsCount: base?.assetsCount || 0,
      notes: draft.notes.trim(),
      nextAction: draft.nextAction.trim(),
      capacityImpact: draft.capacityImpact
    };
    if (base) onUpdateProject(project);
    else onAddProject(project);
    setIsCreating(false);
    setEditingProject(null);
    playCyberSound('boot');
  };

  const updateProject = (project: DigitalOpsProject, patch: Partial<DigitalOpsProject>) => {
    onUpdateProject({ ...project, ...patch });
  };

  const toggleTask = (project: DigitalOpsProject, taskId: string) => {
    const tasks = (project.tasks || []).map(task => task.id === taskId ? { ...task, completed: !task.completed } : task);
    const progress = tasks.length ? Math.round(tasks.filter(task => task.completed).length / tasks.length * 100) : project.progress;
    updateProject(project, { tasks, progress });
  };

  const addTask = (project: DigitalOpsProject) => {
    if (!taskDraft.trim()) return;
    const task: ProjectTask = {
      id: 'task-' + Date.now(),
      title: taskDraft.trim(),
      completed: false,
      dueDate: taskDateDraft || undefined
    };
    updateProject(project, { tasks: [...(project.tasks || []), task] });
    setTaskDraft('');
    setTaskDateDraft('');
  };

  const removeTask = (project: DigitalOpsProject, taskId: string) => {
    const tasks = (project.tasks || []).filter(task => task.id !== taskId);
    const progress = tasks.length ? Math.round(tasks.filter(task => task.completed).length / tasks.length * 100) : 0;
    updateProject(project, { tasks, progress });
  };

  const overdue = (deadline?: string) => {
    if (!deadline || deadline === 'NOT SET') return false;
    const parsed = new Date(deadline + 'T23:59:59');
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200"><Briefcase size={18} /></div>
            <h2 className="font-display text-xl font-bold tracking-tight">Digital Operations &amp; Delivery</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Project records, delivery tasks, deadlines and next actions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 font-semibold">{activeCount} active / {projects.length} total</span>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold">
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      {writeError && (
        <div role="alert" className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex flex-wrap items-center justify-between gap-3">
          <span><strong>PROJECT CHANGES NOT SAVED TO SUPABASE.</strong> {writeError} Changes shown here are unconfirmed.</span>
          <div className="flex gap-3 shrink-0">
            <button type="button" onClick={onRetrySave} className="underline font-bold">Retry save</button>
            <button type="button" onClick={onReload} className="underline font-bold">Discard local changes / reload</button>
          </div>
        </div>
      )}
      {!writeError && saveStatus === 'saving' && <p role="status" className="text-[11px] text-amber-700">Saving project changes to Supabase…</p>}
      {!writeError && saveStatus === 'saved' && <p role="status" className="text-[11px] text-emerald-700">Project records synced with Supabase.</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'WEBSITES', name: 'Websites & Dev', icon: Globe },
          { id: 'AUTOMATION', name: 'Automation & AI', icon: Bot },
          { id: 'SOCIAL_MEDIA', name: 'Social Systems', icon: Instagram },
          { id: 'GRAPHIC_DESIGN', name: 'Design & Branding', icon: Palette }
        ].map(pillar => {
          const Icon = pillar.icon;
          const count = projects.filter(project => project.serviceCategory === pillar.id).length;
          const selected = selectedCategory === pillar.id;
          return (
            <button key={pillar.id} type="button" onClick={() => setSelectedCategory(selected ? 'ALL' : pillar.id)}
              className={'p-4 rounded-2xl border text-left transition-all ' + (selected ? 'bg-black border-black text-white' : 'bg-white border-zinc-200 hover:bg-zinc-50')}>
              <div className="flex items-center justify-between"><Icon size={18} /><span className="text-xs font-bold">{count}</span></div>
              <div className="text-xs font-bold mt-2.5">{pillar.name}</div>
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>PROJECT DELIVERY PIPELINE</span>
          <span className="text-[10px] text-zinc-400 font-normal">{filteredProjects.length} projects</span>
        </div>
        {filteredProjects.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProjects.map(project => {
              const Icon = SERVICE_ICONS[project.serviceCategory] || Briefcase;
              const tasks = project.tasks || [];
              const completed = tasks.filter(task => task.completed).length;
              const expanded = expandedProjectId === project.id;
              const isOverdue = overdue(project.deadline);
              return (
                <article key={project.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><span className="p-1.5 rounded-lg bg-zinc-100"><Icon size={14} /></span><h3 className="font-display text-sm font-bold truncate">{project.client}</h3></div>
                      <p className="text-[11px] text-zinc-500 mt-1">{project.serviceName}</p>
                    </div>
                    <span className="text-[9px] px-2 py-1 rounded-full bg-zinc-100 border border-zinc-200 font-bold whitespace-nowrap">{project.status.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-zinc-500">Progress</span><strong>{project.progress || 0}%</strong></div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: String(Math.max(0, Math.min(100, project.progress || 0))) + '%' }} /></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
                    <span className={isOverdue ? 'text-rose-700 font-bold flex items-center gap-1' : 'text-zinc-500 flex items-center gap-1'}>
                      {isOverdue ? <AlertTriangle size={12} /> : <CalendarDays size={12} />}
                      {project.deadline && project.deadline !== 'NOT SET' ? 'Due ' + project.deadline : 'No deadline set'}
                    </span>
                    <span className="text-zinc-500">{completed}/{tasks.length} tasks</span>
                  </div>
                  {project.nextAction && <p className="mt-2 text-[11px] text-zinc-700"><strong>Next:</strong> {project.nextAction}</p>}
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => setExpandedProjectId(expanded ? null : project.id)} className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                      {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{expanded ? 'Hide details' : 'Project details'}
                    </button>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => openEdit(project)} className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-100" aria-label={'Edit ' + project.client}><Pencil size={13} /></button>
                      <button type="button" onClick={() => setDeleteTarget(project)} className="p-2 rounded-full border border-zinc-200 text-rose-600 hover:bg-rose-50" aria-label={'Delete ' + project.client}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-[9px] text-zinc-400 uppercase font-bold">Service</span><strong>{project.serviceCategory.replace('_', ' ')}</strong></div>
                        <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-[9px] text-zinc-400 uppercase font-bold">Retainer</span><strong>{project.monthlyRetainer == null ? 'Not recorded' : 'R' + project.monthlyRetainer.toLocaleString() + ' / mo'}</strong></div>
                        <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-[9px] text-zinc-400 uppercase font-bold">Capacity impact</span><strong>{project.capacityImpact || 'Not assessed'}</strong></div>
                        <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-[9px] text-zinc-400 uppercase font-bold">Assets</span><strong>{project.assetsCount || 0}</strong></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2"><h4 className="text-[11px] font-bold flex items-center gap-1"><ListTodo size={13} /> Delivery tasks</h4><span className="text-[10px] text-zinc-500">{completed} completed</span></div>
                        <div className="space-y-2">
                          {tasks.map(task => (
                            <div key={task.id} className="flex items-start gap-2 text-[11px]">
                              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(project, task.id)} className="mt-0.5 accent-black" aria-label={'Mark ' + task.title + ' complete'} />
                              <div className="min-w-0 flex-1"><span className={task.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}>{task.title}</span>{task.dueDate && <span className="block text-[9px] text-zinc-400">Due {task.dueDate}</span>}</div>
                              <button type="button" onClick={() => removeTask(project, task.id)} className="text-zinc-400 hover:text-rose-600" aria-label={'Remove task ' + task.title}><X size={12} /></button>
                            </div>
                          ))}
                          {!tasks.length && <p className="text-[10px] text-zinc-400">No delivery tasks recorded yet.</p>}
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                          <input value={taskDraft} onChange={event => setTaskDraft(event.target.value)} placeholder="Add a delivery task…" className="min-w-0 p-2.5 rounded-lg border border-zinc-200 text-xs" />
                          <input type="date" value={taskDateDraft} onChange={event => setTaskDateDraft(event.target.value)} className="p-2 rounded-lg border border-zinc-200 text-xs" aria-label="Task deadline" />
                        </div>
                        <button type="button" onClick={() => addTask(project)} disabled={!taskDraft.trim()} className="mt-2 px-3 py-2 rounded-lg bg-black text-white text-[10px] font-semibold disabled:opacity-40">Add task</button>
                      </div>
                      {project.notes && <div className="rounded-xl bg-zinc-50 p-3"><span className="block text-[9px] text-zinc-400 uppercase font-bold mb-1">Project notes</span><p className="text-[11px] text-zinc-700 whitespace-pre-wrap">{project.notes}</p></div>}
                      <button type="button" onClick={() => openEdit(project)} className="w-full py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold hover:bg-zinc-50">Edit full project record</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 text-center">
            <Briefcase size={22} className="mx-auto text-zinc-400 mb-3" />
            <h3 className="font-display text-base font-bold">No project records</h3>
            <p className="text-xs text-zinc-500 mt-1">This pipeline is empty. Create a project when there is a real client engagement to track.</p>
            {selectedCategory !== 'ALL' && <button type="button" onClick={() => setSelectedCategory('ALL')} className="mt-3 text-xs underline">Clear category filter</button>}
          </div>
        )}
      </section>

      {(isCreating || editingProject) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={saveProject} className="w-full max-w-xl bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl space-y-3 my-auto">
            <div className="flex items-center justify-between"><div><h3 className="font-bold text-base">{editingProject ? 'Edit project' : 'New client project'}</h3><p className="text-[11px] text-zinc-500">Changes are saved to the project record in Supabase.</p></div><button type="button" onClick={() => { setIsCreating(false); setEditingProject(null); }} aria-label="Close"><X size={17} /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-[10px] font-semibold text-zinc-500">Client / organisation<input required value={draft.client} onChange={e => setDraft(v => ({ ...v, client: e.target.value }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900" /></label>
              <label className="text-[10px] font-semibold text-zinc-500">Project / service name<input required value={draft.serviceName} onChange={e => setDraft(v => ({ ...v, serviceName: e.target.value }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900" /></label>
              <label className="text-[10px] font-semibold text-zinc-500">Service category<select value={draft.serviceCategory} onChange={e => setDraft(v => ({ ...v, serviceCategory: e.target.value as DigitalOpsProject['serviceCategory'] }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900"><option value="WEBSITES">Websites</option><option value="AUTOMATION">Automation &amp; AI</option><option value="SOCIAL_MEDIA">Social media</option><option value="GRAPHIC_DESIGN">Graphic design</option><option value="CLIENT_PROJECTS">Other client project</option></select></label>
              <label className="text-[10px] font-semibold text-zinc-500">Status<select value={draft.status} onChange={e => setDraft(v => ({ ...v, status: e.target.value as ProjectStatus }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900"><option value="DISCOVERY">Discovery</option><option value="IN_PROGRESS">In progress</option><option value="REVIEW">Review</option><option value="DELIVERED">Delivered</option><option value="MAINTENANCE">Maintenance</option></select></label>
              <label className="text-[10px] font-semibold text-zinc-500">Deadline<input type="date" value={draft.deadline} onChange={e => setDraft(v => ({ ...v, deadline: e.target.value }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900" /></label>
              <label className="text-[10px] font-semibold text-zinc-500">Progress ({draft.progress}%)<input type="range" min="0" max="100" value={draft.progress} onChange={e => setDraft(v => ({ ...v, progress: Number(e.target.value) }))} className="mt-3 w-full accent-black" /></label>
              <label className="text-[10px] font-semibold text-zinc-500">Monthly retainer (optional)<input type="number" min="0" value={draft.monthlyRetainer} onChange={e => setDraft(v => ({ ...v, monthlyRetainer: e.target.value }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900" /></label>
              <label className="text-[10px] font-semibold text-zinc-500">Capacity impact<select value={draft.capacityImpact} onChange={e => setDraft(v => ({ ...v, capacityImpact: e.target.value as DigitalOpsProject['capacityImpact'] }))} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
            </div>
            <label className="block text-[10px] font-semibold text-zinc-500">Next action<textarea value={draft.nextAction} onChange={e => setDraft(v => ({ ...v, nextAction: e.target.value }))} rows={2} placeholder="The next concrete step for this project" className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900" /></label>
            <label className="block text-[10px] font-semibold text-zinc-500">Project notes<textarea value={draft.notes} onChange={e => setDraft(v => ({ ...v, notes: e.target.value }))} rows={3} className="mt-1 w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-900" /></label>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => { setIsCreating(false); setEditingProject(null); }} className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs">Cancel</button><button type="submit" className="px-4 py-2.5 rounded-xl bg-black text-white text-xs font-semibold flex items-center gap-2"><Save size={13} />{editingProject ? 'Save changes' : 'Create project'}</button></div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-zinc-200 p-5 shadow-2xl space-y-3">
            <h3 className="font-bold">Delete project?</h3>
            <p className="text-xs text-zinc-600">This removes “{deleteTarget.client} — {deleteTarget.serviceName}” from the project records.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="px-3 py-2 rounded-lg border text-xs">Cancel</button><button type="button" onClick={() => { onDeleteProject(deleteTarget.id); setDeleteTarget(null); }} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold">Delete project</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalOpsView;
