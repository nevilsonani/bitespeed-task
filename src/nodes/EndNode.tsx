import React from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

export const EndNode: React.FC<NodeProps> = () => {
  return (
    <div className="text-node">
      <Handle type="target" position={Position.Left} />
      <div className="text-node-body">End</div>
    </div>
  );
};


