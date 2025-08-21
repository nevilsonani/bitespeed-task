import { Node } from 'reactflow';

// Data for TextNode
export type TextNodeData = {
  text: string;
};

// Union of supported node data types, keyed by type name
export type ConditionalNodeData = {
  text: string;
};

export type AppNode = Node<TextNodeData | ConditionalNodeData>;


