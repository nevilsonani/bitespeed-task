# BiteSpeed Chatbot Flow Builder

A simple, extensible chatbot flow builder built with React, TypeScript, Vite, and React Flow.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173

# production
npm run build
npm run preview
```

## Features
- Text Node: drag from Nodes Panel, edit text in Settings Panel
- Conditional Node: two outputs (Yes/No), auto-labeled edges
- Start/End Nodes: Start has only source, End has only target
- Edges: one outgoing edge per source handle; multiple incoming per target
- Panels: Nodes Panel swaps to Settings Panel on selection
- Save validation:
  - only one Start node
  - at least one End node
  - more than one node cannot have an empty target (multiple roots)
  - no empty text
  - no cycles
  - all nodes reachable from Start
- Autosave to localStorage
- Export/Import JSON of `{ nodes, edges }`
- Undo/Redo and shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y, Delete, Ctrl/Cmd+D)

## Structure
```
src/
  components/       # panels
  nodes/            # custom node components
  store/            # Zustand store, history, connect rules
  types.ts          # node data types
  App.tsx           # canvas + top bar + validation
  main.tsx          # entry
  styles.css        # styles
```

## Add a new node type
1) Create `src/nodes/YourNode.tsx` implementing React Flow `NodeProps<Data>`
2) Register in `nodeTypes` inside `src/App.tsx`
3) Add item to `src/components/NodesPanel.tsx`
4) Optionally add an `addYourNode` helper in the store

Registration example in `App.tsx`:
```ts
import { YourNode } from './nodes/YourNode';
const nodeTypes = { ...existing, yourNode: YourNode } as const;
```

## Export/Import format
```json
{
  "nodes": [{ "id": "...", "type": "textNode", "position": {"x":0,"y":0}, "data": {"text": "..."} }],
  "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "Yes" }]
}
```

## Scripts
- dev: start Vite
- build: type-check + build
- preview: preview build

## License
MIT
