import * as fetcher from "./fetcher.js";
import dagre from '@dagrejs/dagre';

export const generateDag = (steps) => {
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'TB', // Top to bottom layout
    nodesep: 50,   // Horizontal separation between nodes
    ranksep: 50,   // Vertical separation between ranks
    marginx: 20,
    marginy: 20,
    ranker: 'tight-tree',
  });

  // Default to assigning a new object as a label for each new edge
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with labels and dimensions
  const nw = 200
  const nh = 85
  for (const s of steps) {
    console.log(s)
    g.setNode("s" + s.index, {
      label: s.name, width: nw, height: nh,
      step: s
    });
  }

  for (const s of steps) {
    if (s.pipelineSource &&
      g.hasNode("s" + s.pipelineSource[2]) &&
      s.type === "pipeline") {
      g.setEdge("s" + s.pipelineSource[2], "s" + s.index);
    }
  }

  dagre.layout(g);

  const nodes = g.nodes().map(v => {
    const node = g.node(v);
    return {
      id: v,
      label: node.label,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      step: node.step,
    };
  });

  const edges = g.edges().map(e => {
    const edge = g.edge(e);
    const sourceNode = g.node(e.v);
    const targetNode = g.node(e.w);

    // Draw straight line from bottom of source to top of target
    return {
      from: e.v,
      to: e.w,
      x1: sourceNode.x,
      y1: sourceNode.y + sourceNode.height / 2,
      x2: targetNode.x,
      y2: targetNode.y - targetNode.height / 2
    };
  });

  // Calculate total graph dimensions
  const graphWidth = g.graph().width + 40;
  const graphHeight = g.graph().height + 40;

  return `
  <div class="graph-container" style="height: ${graphHeight}px; width: ${graphWidth}px;">
    <!-- SVG for edges -->
    <svg style="position: absolute; width: 100%; height: 100%; pointer-events: none;">
      <defs>
	<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
	  <polygon points="0 0, 10 3, 0 6" fill="#666" />
	</marker>
      </defs>
     ${edges.map(edge => {
       // Calculate midpoint
       const midX = (edge.x1 + edge.x2) / 2;
       const midY = (edge.y1 + edge.y2) / 2;
       return `<line class="edge-line" x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}" />
      <polygon points="${midX - 5},${midY - 3} ${midX + 5},${midY} ${midX - 5},${midY + 3}" fill="#000" transform="rotate(${Math.atan2(edge.y2 - edge.y1, edge.x2 - edge.x1) * 180 / Math.PI} ${midX} ${midY})" />`;
     }).join('\n      ')}

    </svg>

    <!-- Nodes as divs -->
    ${nodes.map(node => `
    <a href="/d/${node.step.datasetId}/f/${node.step.index}">
    <div class="node" style="left: ${node.x}px; top: ${node.y}px; width: ${node.width}px;
height: ${node.height}px;">
      <div class="head">
	<span>#${node.step.index}</span><span>${node.step.status}</span>
      </div>
      <div class="label">${node.label}</div>
      <div class="foot">
	<span>${fetcher.countTasks(node.step, "active")} active</span>
	<span>${fetcher.countTasks(node.step, "done")} done</span>
      </div>
    </div>
    </a>`).join('')}
  </div>


`;
};
