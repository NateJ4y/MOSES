import React, { useState } from 'react';
import { 
  GitBranch, 
  Play, 
  Plus, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Server, 
  Database, 
  Bell, 
  Activity, 
  Cpu,
  ArrowRight
} from 'lucide-react';
import { WorkflowNode, WorkflowEdge, NodeType } from '../../types';
import { INITIAL_WORKFLOW_NODES, INITIAL_WORKFLOW_EDGES } from '../../data/initialData';
import { playCyberSound } from '../../utils/audio';

const NODE_COLORS: Record<NodeType, { border: string; bg: string; text: string }> = {
  TRIGGER: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' },
  INPUT: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' },
  PROCESS: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' },
  DECISION: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' },
  ACTION: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' },
  NOTIFICATION: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' },
  DATABASE: { border: 'border-zinc-300', bg: 'bg-zinc-100', text: 'text-zinc-900' }
};

export const SystemsView: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_WORKFLOW_NODES);
  const [edges, setEdges] = useState<WorkflowEdge[]>(INITIAL_WORKFLOW_EDGES);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState('NOT CONNECTED');
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(nodes[0] || null);

  const handleRunWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunStatus('RUNNING');
    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });
      const data = await response.json();
      setRunStatus(data.status || 'ERROR');
    } catch {
      setRunStatus('ERROR');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddNode = (type: NodeType) => {
    playCyberSound('click');
    const newNode: WorkflowNode = {
      id: `n-${Date.now()}`,
      type,
      title: `New ${type} Node`,
      description: `Configured automated step for ${type.toLowerCase()}`,
      x: 100,
      y: 100
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <GitBranch size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Systems &amp; Workflow Architecture
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            "Most agencies sell services. We build scalable automated infrastructure."
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer ${
              isRunning
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-black hover:bg-zinc-800 text-white'
            }`}
          >
            <Play size={13} className={isRunning ? 'animate-spin' : ''} />
            <span>{isRunningSim ? 'Simulating Workflow...' : 'Simulate Workflow Run'}</span>
          </button>
        </div>
      </div>

      {/* Node Palette Bar */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] text-zinc-400 font-bold uppercase shrink-0">Add Pipeline Step:</span>
        <div className="flex items-center gap-2">
          {(['TRIGGER', 'INPUT', 'PROCESS', 'DECISION', 'ACTION', 'NOTIFICATION', 'DATABASE'] as NodeType[]).map((type) => {
            return (
              <button
                key={type}
                onClick={() => handleAddNode(type)}
                className="px-3 py-1.5 rounded-full border border-zinc-300 bg-white text-zinc-800 text-[10px] font-semibold transition-all flex items-center gap-1 shrink-0 hover:bg-zinc-100 cursor-pointer shadow-2xs"
              >
                <Plus size={10} />
                <span>{type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Workflow Visual Stage */}
      <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6 relative shadow-xs min-h-[440px] flex flex-col justify-between">
        {/* Blueprint Title */}
        <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-200 pb-3 mb-4">
          <span className="text-zinc-900 font-bold">
            Blueprint: Instant Lead Qualification &amp; WhatsApp Dispatch
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">
            {isRunningSim ? '● Simulating live payload' : '○ Engine ready'}
          </span>
        </div>

        {/* Nodes Flow Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 my-auto">
          {nodes.map((node, idx) => {
            const isSimActive = false;
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => {
                  playCyberSound('click');
                  setSelectedNode(node);
                }}
                className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 relative ${
                  isSimActive
                    ? 'scale-105 ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300 shadow-sm'
                    : isSelected
                    ? 'border-black bg-white shadow-sm ring-1 ring-black'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                      {node.type}
                    </span>
                    <span className="text-[9px] text-zinc-400">0{idx + 1}</span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-900 mb-1">{node.title}</h4>
                  <p className="text-[10px] text-zinc-500 leading-snug">{node.description}</p>
                </div>

                {idx < nodes.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-zinc-400 z-10">
                    <ArrowRight size={13} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Inspector for Selected Node */}
        {selectedNode && (
          <div className="mt-4 pt-3 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
            <div>
              <span className="text-[10px] text-zinc-900 uppercase font-bold">
                Active Node Inspector: [{selectedNode.type}] {selectedNode.title}
              </span>
              <p className="text-zinc-600 text-xs mt-0.5">{selectedNode.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-700 font-semibold">
                n8n Compatible &bull; JSON Schema Valid
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
