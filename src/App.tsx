import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { 
  Background, 
  BackgroundVariant, 
  Controls, 
  MiniMap, 
  ReactFlowProvider, 
  useReactFlow, 
  Edge, 
  Node 
} from 'reactflow';
import 'reactflow/dist/style.css';
import './styles.css';

import { useFlowStore } from './store/flowStore';
import { NodesPanel } from './components/NodesPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { TextNode } from './nodes/TextNode';
import { ConditionalNode } from './nodes/ConditionalNode';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { TextNodeData } from './types';

// Mapping of custom node types
const nodeTypes = { textNode: TextNode, conditionalNode: ConditionalNode, startNode: StartNode, endNode: EndNode } as const;

// ReactFlow surface wrapped with provider to support DnD projection
const Canvas: React.FC = () => {
  const reactFlowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveIsError, setSaveIsError] = useState(false);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    addTextNode,
    addConditionalNode,
    deleteSelectedNode,
    duplicateSelectedNode,
    undo,
    redo,
  } = useFlowStore();

  const { project } = useReactFlow();

  const handleNodeClick = useCallback((_evt: React.MouseEvent, node: { id: string }) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(undefined);
  }, [setSelectedNodeId]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const bounds = reactFlowWrapperRef.current?.getBoundingClientRect();
    const position = project({
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });

    if (type === 'textNode') {
      addTextNode(position, 'Text message');
    } else if (type === 'conditionalNode') {
      addConditionalNode(position, 'Condition');
    } else if (type === 'startNode') {
      useFlowStore.setState((s) => ({ nodes: s.nodes.concat({ id: crypto.randomUUID().slice(0,8), type: 'startNode' as any, position, data: { text: 'Start' } as any }) }));
    } else if (type === 'endNode') {
      useFlowStore.setState((s) => ({ nodes: s.nodes.concat({ id: crypto.randomUUID().slice(0,8), type: 'endNode' as any, position, data: { text: 'End' } as any }) }));
    }
  }, [addTextNode, addConditionalNode, project]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNode();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedNode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSelectedNode, duplicateSelectedNode, undo, redo]);

  const handleSave = useCallback(() => {
    const nodesCount = nodes.length;
    const rootNodes = nodes.filter((n) => edges.every((e) => e.target !== n.id));
    const multiRoots = nodesCount > 1 && rootNodes.length > 1;

    const emptyTexts = nodes.some((n) => String((n.data as any)?.text ?? '').trim().length === 0);

    const adjacency: Record<string, string[]> = {};
    nodes.forEach((n) => { adjacency[n.id] = []; });
    edges.forEach((e) => { if (e.source && e.target) adjacency[e.source].push(e.target); });

    const visited: Record<string, number> = {};
    let hasCycle = false;
    const dfs = (id: string) => {
      if (visited[id] === 1) { hasCycle = true; return; }
      if (visited[id] === 2) return;
      visited[id] = 1;
      for (const nxt of adjacency[id] || []) dfs(nxt);
      visited[id] = 2;
    };
    nodes.forEach((n) => { if (!visited[n.id]) dfs(n.id); });

    const startCount = nodes.filter((n) => n.type === 'startNode').length;
    const endCount = nodes.filter((n) => n.type === 'endNode').length;

    let unreachable = false;
    if (startCount === 1) {
      const startId = nodes.find((n) => n.type === 'startNode')!.id;
      const reachable: Record<string, boolean> = {};
      const queue: string[] = [startId];
      reachable[startId] = true;
      while (queue.length) {
        const cur = queue.shift()!;
        for (const nxt of adjacency[cur] || []) {
          if (!reachable[nxt]) { reachable[nxt] = true; queue.push(nxt); }
        }
      }
      unreachable = nodes.some((n) => !reachable[n.id]);
    }

    let message = 'Flow saved successfully.';
    let isError = false;
    if (multiRoots) { isError = true; message = 'Error: Multiple starting nodes detected.'; }
    else if (emptyTexts) { isError = true; message = 'Error: Some nodes have empty text.'; }
    else if (hasCycle) { isError = true; message = 'Error: Cycle detected in flow.'; }
    else if (startCount !== 1) { isError = true; message = 'Error: There must be exactly one Start node.'; }
    else if (endCount < 1) { isError = true; message = 'Error: Add at least one End node.'; }
    else if (unreachable) { isError = true; message = 'Error: Some nodes are not reachable from Start.'; }

    setSaveIsError(isError);
    setSaveMessage(message);
  }, [nodes, edges]);

  const handleExport = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { nodes: Node[]; edges: Edge[] };
        useFlowStore.setState({ nodes: parsed.nodes as any, edges: parsed.edges });
      } catch (e) {
        setSaveIsError(true);
        setSaveMessage('Invalid flow JSON');
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="canvas" ref={reactFlowWrapperRef}>
      <div className="topbar">
        <button onClick={handleSave} style={{ marginRight: 8 }}>Save</button>
        <button onClick={handleExport} style={{ marginRight: 8 }}>Export</button>
        <label style={{ display: 'inline-block' }}>
          <span className="sr-only">Import</span>
          <input type="file" accept="application/json" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.currentTarget.value = '';
          }} />
        </label>
        <span style={{ marginLeft: 12 }} />
        <button onClick={undo} style={{ marginRight: 8 }}>Undo</button>
        <button onClick={redo} style={{ marginRight: 8 }}>Redo</button>
        <button onClick={duplicateSelectedNode} style={{ marginRight: 8 }}>Duplicate</button>
        <button onClick={deleteSelectedNode}>Delete</button>
      </div>
      {saveMessage && (
        <div className="save-banner" style={{ borderColor: saveIsError ? '#f66' : '#6c6', color: '#222' }}>
          {saveMessage}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <MiniMap />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  );
};

const App: React.FC = () => {
  const { selectedNodeId } = useFlowStore();

  return (
    <ReactFlowProvider>
      <div className="app">
        <aside className="sidebar">
          {selectedNodeId ? <SettingsPanel /> : <NodesPanel />}
        </aside>
        <Canvas />
      </div>
    </ReactFlowProvider>
  );
};

export default App;
