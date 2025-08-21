import React, { useMemo } from 'react';
import { useFlowStore } from '../store/flowStore';

// Panel to edit selected node's text
export const SettingsPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateTextForNode, clearSelection, deleteSelectedNode, duplicateSelectedNode } = useFlowStore();

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  if (!selectedNode) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Settings</h3>
        <button className="link" onClick={clearSelection} title="Back to Nodes">Back</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={duplicateSelectedNode}>Duplicate</button>
        <button onClick={deleteSelectedNode}>Delete</button>
      </div>
      <label className="field">
        <span>Text</span>
        <textarea
          value={String(selectedNode.data?.text ?? '')}
          onChange={(e) => updateTextForNode(selectedNode.id, e.target.value)}
          rows={6}
        />
      </label>
    </div>
  );
};


