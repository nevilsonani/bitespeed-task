import React from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

export const StartNode: React.FC<NodeProps> = () => {
  return (
    <div className="text-node">
      <div className="text-node-body">Start</div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
};


