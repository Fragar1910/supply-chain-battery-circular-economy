'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';

export interface SupplyChainEvent {
  id: string;
  role: 'Supplier' | 'Manufacturer' | 'OEM' | 'Owner' | 'SecondLife' | 'Recycler';
  timestamp: string;
  actor: string;
  description: string;
}

interface SupplyChainGraphProps {
  events: SupplyChainEvent[];
  className?: string;
}

const roleColors = {
  Supplier: { bg: '#3b82f6', border: '#2563eb' },
  Manufacturer: { bg: '#10b981', border: '#059669' },
  OEM: { bg: '#8b5cf6', border: '#7c3aed' },
  Owner: { bg: '#06b6d4', border: '#0891b2' },
  SecondLife: { bg: '#f59e0b', border: '#d97706' },
  Recycler: { bg: '#6b7280', border: '#4b5563' },
};

const roleIcons = {
  Supplier: '⛏️',
  Manufacturer: '🏭',
  OEM: '🚗',
  Owner: '👤',
  SecondLife: '🔋',
  Recycler: '♻️',
};

export function SupplyChainGraph({ events, className }: SupplyChainGraphProps) {
  // Generate nodes from events
  const initialNodes: Node[] = events.map((event, index) => {
    const color = roleColors[event.role];
    return {
      id: event.id,
      type: 'default',
      data: {
        label: (
          <div className="text-center px-2 py-1">
            <div className="text-2xl mb-1">{roleIcons[event.role]}</div>
            <div className="font-semibold text-sm">{event.role}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {new Date(event.timestamp).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      position: { x: index * 250, y: 100 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: color.bg,
        color: 'white',
        border: `2px solid ${color.border}`,
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px',
      },
    };
  });

  // Generate edges between consecutive events
  const initialEdges: Edge[] = events.slice(0, -1).map((event, index) => ({
    id: `e${event.id}-${events[index + 1].id}`,
    source: event.id,
    target: events[index + 1].id,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#64748b', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#64748b',
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className={cn('w-full h-96 rounded-lg border dark:border-slate-800', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const role = events.find((e) => e.id === node.id)?.role;
            return role ? roleColors[role].bg : '#64748b';
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
        />
      </ReactFlow>
    </div>
  );
}
