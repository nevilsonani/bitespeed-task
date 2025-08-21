import React from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { TextNodeData } from '../types';

// Simple text node with a single target and single source handle
export const TextNode: React.FC<NodeProps<TextNodeData>> = ({ data }) => {
  return (
    <div className="text-node">
      <Handle type="target" position={Position.Left} />
      <div className="text-node-body">{data.text}</div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
};


