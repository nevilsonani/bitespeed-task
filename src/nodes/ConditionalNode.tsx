import React from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { ConditionalNodeData } from '../types';

// Conditional node with Yes/No source handles
export const ConditionalNode: React.FC<NodeProps<ConditionalNodeData>> = ({ data }) => {
  return (
    <div className="text-node">
      <Handle type="target" position={Position.Left} />
      <div className="text-node-body">
        {data.text || 'Condition'}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#9aa1af' }}>Yes/No outputs</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="yes" />
      <Handle type="source" position={Position.Bottom} id="no" />
    </div>
  );
};


