// Flowchart Tools for AI Model Interaction
// This module provides utilities for AI models to programmatically create and manipulate flowcharts

let nodeIdCounter = 1000; // Start with high number to avoid conflicts

export const NODE_TYPES = ['start', 'process', 'decision', 'end'];

/**
 * Generate a unique node ID
 */
export const generateNodeId = () => `ai_node_${nodeIdCounter++}`;

/**
 * Generate a unique edge ID
 */
export const generateEdgeId = () => `ai_edge_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/**
 * Create a new flowchart node
 * @param {string} type - Node type: 'start', 'process', 'decision', 'end'
 * @param {string} label - Node label text
 * @param {Object} position - Node position {x, y}
 * @returns {Object} New node object
 */
export const createNode = (type, label, position = null) => {
  const nodeType = NODE_TYPES.includes(type) ? type : 'process';
  const nodeId = generateNodeId();

  return {
    id: nodeId,
    type: nodeType,
    data: {
      label: label || `New ${nodeType}`,
      nodeType,
    },
    position: position || {
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
    },
  };
};

/**
 * Create a connection between two nodes
 */
export const createConnection = (sourceId, targetId, label = null) => ({
  id: generateEdgeId(),
  source: sourceId,
  target: targetId,
  label: label || undefined,
  type: 'smoothstep',
  animated: false,
});

/**
 * Layer nodes top-to-bottom based on edges using a BFS over the DAG.
 * Returns a new nodes array with positions assigned.
 */
export const autoLayoutFlowchart = (nodes, edges, opts = {}) => {
  const horizontalSpacing = opts.horizontalSpacing ?? 220;
  const verticalSpacing = opts.verticalSpacing ?? 130;
  const startY = opts.startY ?? 60;

  if (nodes.length === 0) return nodes;

  // Build adjacency
  const incoming = new Map(); // id -> count
  const outgoing = new Map(); // id -> [ids]
  nodes.forEach(n => {
    incoming.set(n.id, 0);
    outgoing.set(n.id, []);
  });
  edges.forEach(e => {
    if (incoming.has(e.target)) incoming.set(e.target, incoming.get(e.target) + 1);
    if (outgoing.has(e.source)) outgoing.get(e.source).push(e.target);
  });

  // Roots: prefer 'start' typed nodes, otherwise nodes with no incoming edges
  const startNodes = nodes.filter(n => (n.data?.nodeType || n.type) === 'start');
  const noIncoming = nodes.filter(n => incoming.get(n.id) === 0);
  const roots = startNodes.length > 0 ? startNodes : (noIncoming.length > 0 ? noIncoming : [nodes[0]]);

  // Assign layers via BFS; later occurrences override earlier (longest path wins)
  const layer = new Map();
  const queue = roots.map(r => ({ id: r.id, depth: 0 }));
  const visited = new Set();
  while (queue.length) {
    const { id, depth } = queue.shift();
    const prev = layer.get(id);
    if (prev === undefined || depth > prev) layer.set(id, depth);
    if (visited.has(id) && (prev !== undefined && depth <= prev)) continue;
    visited.add(id);
    (outgoing.get(id) || []).forEach(child => {
      queue.push({ id: child, depth: depth + 1 });
    });
  }
  // Any node still without a layer (disconnected) goes to layer 0
  nodes.forEach(n => { if (!layer.has(n.id)) layer.set(n.id, 0); });

  // Bucket by layer
  const buckets = new Map();
  layer.forEach((d, id) => {
    if (!buckets.has(d)) buckets.set(d, []);
    buckets.get(d).push(id);
  });

  const maxRowSize = Math.max(...Array.from(buckets.values()).map(arr => arr.length));
  const canvasWidth = maxRowSize * horizontalSpacing;

  // Assign positions, centering each layer horizontally
  const positionedById = new Map();
  Array.from(buckets.keys()).sort((a, b) => a - b).forEach(d => {
    const ids = buckets.get(d);
    const rowWidth = ids.length * horizontalSpacing;
    const offset = (canvasWidth - rowWidth) / 2;
    ids.forEach((id, i) => {
      positionedById.set(id, {
        x: offset + i * horizontalSpacing,
        y: startY + d * verticalSpacing,
      });
    });
  });

  return nodes.map(n => ({ ...n, position: positionedById.get(n.id) || n.position }));
};

/**
 * Parse AI model flowchart instructions and convert to nodes/edges
 */
export const parseFlowchartInstructions = (instructions) => {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  instructions.forEach((instruction) => {
    if (instruction.action === 'create_node') {
      const { type, label, name } = instruction;
      const node = createNode(type, label);
      nodes.push(node);
      nodeMap.set(name || label, node.id);
    }
  });

  instructions.forEach((instruction) => {
    if (instruction.action === 'connect_nodes') {
      const { from, to, label } = instruction;
      const sourceId = nodeMap.get(from);
      const targetId = nodeMap.get(to);
      if (sourceId && targetId) {
        edges.push(createConnection(sourceId, targetId, label));
      }
    }
  });

  return { nodes: autoLayoutFlowchart(nodes, edges), edges };
};

/**
 * Generate flowchart instructions from AI model response.
 * Pulls JSON from ```json blocks; falls back to bare arrays/objects.
 */
export const parseAIFlowchartResponse = (response) => {
  if (!response) return [];
  const instructions = [];

  const tryPush = (parsed) => {
    if (Array.isArray(parsed)) {
      instructions.push(...parsed);
    } else if (parsed && Array.isArray(parsed.flowchart)) {
      instructions.push(...parsed.flowchart);
    } else if (parsed && Array.isArray(parsed.instructions)) {
      instructions.push(...parsed.instructions);
    }
  };

  try {
    // ```json ... ``` blocks
    const fenced = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/g);
    if (fenced) {
      fenced.forEach(block => {
        const inner = block.replace(/```(?:json)?\s*|\s*```/g, '');
        try { tryPush(JSON.parse(inner)); } catch { /* ignore */ }
      });
    }

    // Bare JSON in response (no fence)
    if (instructions.length === 0) {
      const trimmed = response.trim();
      if ((trimmed.startsWith('[') || trimmed.startsWith('{'))) {
        try { tryPush(JSON.parse(trimmed)); } catch { /* ignore */ }
      }
    }

    // Try to extract first complete JSON array from anywhere in the text
    if (instructions.length === 0) {
      const arrMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (arrMatch) {
        try { tryPush(JSON.parse(arrMatch[0])); } catch { /* ignore */ }
      }
    }
  } catch (error) {
    console.error('Error parsing AI flowchart response:', error);
  }

  return instructions;
};

/**
 * Validate flowchart instructions
 */
export const validateFlowchartInstructions = (instructions) => {
  const errors = [];
  const nodeNames = new Set();

  if (!Array.isArray(instructions)) {
    return { valid: false, errors: ['Instructions must be an array'] };
  }

  instructions.forEach((instruction, index) => {
    if (!instruction.action) {
      errors.push(`Instruction ${index}: Missing action`);
      return;
    }
    if (instruction.action === 'create_node') {
      if (!instruction.name) errors.push(`Instruction ${index}: Missing node name`);
      else nodeNames.add(instruction.name);
      if (!instruction.type) errors.push(`Instruction ${index}: Missing node type`);
      else if (!NODE_TYPES.includes(instruction.type)) {
        errors.push(`Instruction ${index}: Invalid node type "${instruction.type}". Must be: ${NODE_TYPES.join(', ')}`);
      }
    } else if (instruction.action === 'connect_nodes') {
      if (!instruction.from || !instruction.to) {
        errors.push(`Instruction ${index}: Missing 'from' or 'to' node for connection`);
      }
    } else {
      errors.push(`Instruction ${index}: Unknown action "${instruction.action}"`);
    }
  });

  instructions.forEach((instruction, index) => {
    if (instruction.action === 'connect_nodes') {
      if (instruction.from && !nodeNames.has(instruction.from)) {
        errors.push(`Instruction ${index}: Referenced node "${instruction.from}" does not exist`);
      }
      if (instruction.to && !nodeNames.has(instruction.to)) {
        errors.push(`Instruction ${index}: Referenced node "${instruction.to}" does not exist`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Get system prompt for AI flowchart creation
 */
export const getFlowchartSystemPrompt = () => {
  return `You are in flowchart creation mode. When the user requests a flowchart, respond with JSON instructions to create the flowchart programmatically.

Use this exact JSON format inside a single \`\`\`json fenced block:
\`\`\`json
[
  {"action": "create_node", "name": "node_name", "type": "start|process|decision|end", "label": "Display text"},
  {"action": "connect_nodes", "from": "source_node_name", "to": "target_node_name", "label": "optional connection label"}
]
\`\`\`

Node Types:
- "start": Beginning of the process (rendered as a green pill)
- "process": Regular process step (rendered as a blue rectangle)
- "decision": Decision point (rendered as an amber diamond) — outgoing edges should have labels like "Yes" / "No"
- "end": End of the process (rendered as a red pill)

Rules:
1. Always start with at least one "start" node and end with at least one "end" node.
2. Use "process" for regular steps and "decision" for branching points.
3. Label decision outgoing edges (e.g. "Yes", "No", "Valid", "Invalid") so the diagram is readable.
4. Node "name" values must be unique short identifiers (snake_case). "label" is the human-readable text.
5. Keep labels concise — under ~6 words is ideal.
6. Create all nodes first, then add the connections.

Example:
\`\`\`json
[
  {"action": "create_node", "name": "begin", "type": "start", "label": "Begin"},
  {"action": "create_node", "name": "check_input", "type": "decision", "label": "Input valid?"},
  {"action": "create_node", "name": "process_data", "type": "process", "label": "Process data"},
  {"action": "create_node", "name": "show_error", "type": "process", "label": "Show error"},
  {"action": "create_node", "name": "finish", "type": "end", "label": "End"},
  {"action": "connect_nodes", "from": "begin", "to": "check_input"},
  {"action": "connect_nodes", "from": "check_input", "to": "process_data", "label": "Yes"},
  {"action": "connect_nodes", "from": "check_input", "to": "show_error", "label": "No"},
  {"action": "connect_nodes", "from": "process_data", "to": "finish"},
  {"action": "connect_nodes", "from": "show_error", "to": "finish"}
]
\`\`\`

Always provide the JSON inside one fenced block, then a brief explanation after.`;
};
