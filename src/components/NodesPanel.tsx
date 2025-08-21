import React from 'react';

// Extensible nodes panel: add more node items later easily
export const NodesPanel: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    // React Flow DnD convention key
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="panel">
      <h3>Nodes</h3>
      <div
        className="panel-item"
        draggable
        onDragStart={(event) => onDragStart(event, 'startNode')}
        title="Drag to canvas"
      >
        Start
      </div>
      <div
        className="panel-item"
        style={{ marginTop: 10 }}
        draggable
        onDragStart={(event) => onDragStart(event, 'endNode')}
        title="Drag to canvas"
      >
        End
      </div>
      <div
        className="panel-item"
        style={{ marginTop: 10 }}
        draggable
        onDragStart={(event) => onDragStart(event, 'textNode')}
        title="Drag to canvas"
      >
        Text Message
      </div>
      <div
        className="panel-item"
        style={{ marginTop: 10 }}
        draggable
        onDragStart={(event) => onDragStart(event, 'conditionalNode')}
        title="Drag to canvas"
      >
        Conditional
      </div>
    </div>
  );
};


