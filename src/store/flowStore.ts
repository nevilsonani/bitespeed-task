import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Edge, Node, XYPosition, Connection, addEdge, OnEdgesChange, OnNodesChange, applyEdgeChanges, applyNodeChanges } from 'reactflow';
import { TextNodeData } from '../types';

type Store = {
  nodes: Node<TextNodeData>[];
  edges: Edge[];
  past: { nodes: Node<TextNodeData>[]; edges: Edge[] }[];
  future: { nodes: Node<TextNodeData>[]; edges: Edge[] }[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id?: string) => void;
  clearSelection: () => void;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;

  addTextNode: (position: XYPosition, text: string) => void;
  addConditionalNode: (position: XYPosition, text: string) => void;
  updateTextForNode: (id: string, text: string) => void;
  deleteSelectedNode: () => void;
  duplicateSelectedNode: () => void;
  undo: () => void;
  redo: () => void;
  setGraph: (nodes: Node<TextNodeData>[], edges: Edge[]) => void;
};

// Helper: enforce single outgoing edge per source handle by replacing prior one
function upsertEdgeReplacingExistingOutgoing(edges: Edge[], connection: Connection): Edge[] {
  const { source, sourceHandle } = connection;
  if (!source) return addEdge(connection, edges);

  const filtered = edges.filter((e) => !(e.source === source && (sourceHandle ? e.sourceHandle === sourceHandle : true)));
  return addEdge(connection, filtered);
}

function cloneGraph(nodes: Node<TextNodeData>[], edges: Edge[]): { nodes: Node<TextNodeData>[]; edges: Edge[] } {
  // Deep clone to avoid history referencing same objects
  return {
    nodes: JSON.parse(JSON.stringify(nodes)) as Node<TextNodeData>[],
    edges: JSON.parse(JSON.stringify(edges)) as Edge[],
  };
}

export const useFlowStore = create<Store>()(persist((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  selectedNodeId: null,

  setSelectedNodeId: (id) => set({ selectedNodeId: id ?? null }),
  clearSelection: () => set({ selectedNodeId: null }),

  onNodesChange: (changes) => set((state) => ({
    past: state.past.concat(cloneGraph(state.nodes, state.edges)),
    future: [],
    nodes: applyNodeChanges(changes, state.nodes),
  })),
  onEdgesChange: (changes) => set((state) => ({
    past: state.past.concat(cloneGraph(state.nodes, state.edges)),
    future: [],
    edges: applyEdgeChanges(changes, state.edges),
  })),
  onConnect: (connection) => set((state) => ({
    past: state.past.concat(cloneGraph(state.nodes, state.edges)),
    future: [],
    // Label edge based on source handle id when available
    edges: (() => {
      // Prevent invalid connections: into startNode or from endNode
      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      const targetNode = state.nodes.find((n) => n.id === connection.target);
      if (sourceNode?.type === 'endNode' || targetNode?.type === 'startNode') {
        return state.edges;
      }
      return upsertEdgeReplacingExistingOutgoing(
        state.edges,
        { ...connection, label: connection.sourceHandle === 'yes' ? 'Yes' : connection.sourceHandle === 'no' ? 'No' : undefined } as any
      );
    })(),
  })),

  addTextNode: (position, text) =>
    set((state) => ({
      past: state.past.concat(cloneGraph(state.nodes, state.edges)),
      future: [],
      nodes: state.nodes.concat({
        id: nanoid(8),
        type: 'textNode',
        position,
        data: { text },
      }),
    })),

  addConditionalNode: (position, text) =>
    set((state) => ({
      past: state.past.concat(cloneGraph(state.nodes, state.edges)),
      future: [],
      nodes: state.nodes.concat({
        id: nanoid(8),
        type: 'conditionalNode',
        position,
        data: { text },
      }),
    })),

  updateTextForNode: (id, text) =>
    set((state) => ({
      past: state.past.concat(cloneGraph(state.nodes, state.edges)),
      future: [],
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...(n.data as TextNodeData), text } } : n)),
    })),

  deleteSelectedNode: () =>
    set((state) => {
      if (!state.selectedNodeId) return {} as any;
      const id = state.selectedNodeId;
      const nextNodes = state.nodes.filter((n) => n.id !== id);
      const nextEdges = state.edges.filter((e) => e.source !== id && e.target !== id);
      return {
        past: state.past.concat(cloneGraph(state.nodes, state.edges)),
        future: [],
        nodes: nextNodes,
        edges: nextEdges,
        selectedNodeId: null,
      };
    }),

  duplicateSelectedNode: () =>
    set((state) => {
      const current = state.nodes.find((n) => n.id === state.selectedNodeId);
      if (!current) return {} as any;
      const newId = nanoid(8);
      const clone: Node<TextNodeData> = {
        ...JSON.parse(JSON.stringify(current)),
        id: newId,
        position: { x: current.position.x + 40, y: current.position.y + 40 },
      };
      return {
        past: state.past.concat(cloneGraph(state.nodes, state.edges)),
        future: [],
        nodes: state.nodes.concat(clone),
        selectedNodeId: newId,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {} as any;
      const previous = state.past[state.past.length - 1];
      const futureEntry = cloneGraph(state.nodes, state.edges);
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        past: state.past.slice(0, -1),
        future: state.future.concat(futureEntry),
        selectedNodeId: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {} as any;
      const next = state.future[state.future.length - 1];
      const pastEntry = cloneGraph(state.nodes, state.edges);
      return {
        nodes: next.nodes,
        edges: next.edges,
        future: state.future.slice(0, -1),
        past: state.past.concat(pastEntry),
        selectedNodeId: null,
      };
    }),

  setGraph: (nodes, edges) =>
    set((state) => ({
      past: state.past.concat(cloneGraph(state.nodes, state.edges)),
      future: [],
      nodes,
      edges,
      selectedNodeId: null,
    })),
}), { name: 'bitespeed-flow' }));


