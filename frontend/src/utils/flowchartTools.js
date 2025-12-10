// Flowchart Tools for AI Model Interaction
// This module provides utilities for AI models to programmatically create and manipulate flowcharts

let nodeIdCounter = 1000; // Start with high number to avoid conflicts

/**
 * Generate a unique node ID
 */
export const generateNodeId = () => `ai_node_${nodeIdCounter++}`;

/**
 * Generate a unique edge ID
 */
export const generateEdgeId = () => `ai_edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create a new flowchart node
 * @param {string} type - Node type: 'start', 'process', 'decision', 'end'
 * @param {string} label - Node label text
 * @param {Object} position - Node position {x, y}
 * @param {Function} onLabelChange - Callback for label changes
 * @returns {Object} New node object
 */
export const createNode = (type, label, position = null, onLabelChange = null) => {
  const nodeId = generateNodeId();
  const defaultPositions = {
    x: 100 + Math.random() * 300,
    y: 100 + Math.random() * 200,
  };

  const nodeTypeMapping = {
    start: 'input',
    process: 'default',
    decision: 'default',
    end: 'output',
  };

  return {
    id: nodeId,
    type: nodeTypeMapping[type] || 'default',
    data: {
      label: label || `New ${type}`,
      nodeType: type,
      onLabelChange: onLabelChange || (() => {}),
    },
    position: position || defaultPositions,
  };
};

/**
 * Create a connection between two nodes
 * @param {string} sourceId - Source node ID
 * @param {string} targetId - Target node ID
 * @param {string} label - Edge label (optional)
 * @returns {Object} New edge object
 */
export const createConnection = (sourceId, targetId, label = null) => {
  return {
    id: generateEdgeId(),
    source: sourceId,
    target: targetId,
    label: label,
    type: 'smoothstep',
    animated: false,
  };
};

/**
 * Parse AI model flowchart instructions and convert to nodes/edges
 * @param {Array} instructions - Array of flowchart instructions
 * @param {Function} onLabelChange - Callback for label changes
 * @returns {Object} {nodes, edges} arrays
 */
export const parseFlowchartInstructions = (instructions, onLabelChange) => {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map(); // Map node names to IDs

  // First pass: create all nodes
  instructions.forEach((instruction, index) => {
    if (instruction.action === 'create_node') {
      const { type, label, name } = instruction;
      const position = {
        x: 200 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 150,
      };
      
      const node = createNode(type, label, position, onLabelChange);
      nodes.push(node);
      nodeMap.set(name || label, node.id);
    }
  });

  // Second pass: create connections
  instructions.forEach((instruction) => {
    if (instruction.action === 'connect_nodes') {
      const { from, to, label } = instruction;
      const sourceId = nodeMap.get(from);
      const targetId = nodeMap.get(to);
      
      if (sourceId && targetId) {
        const edge = createConnection(sourceId, targetId, label);
        edges.push(edge);
      }
    }
  });

  return { nodes, edges };
};

/**
 * Generate flowchart instructions from AI model response
 * @param {string} response - AI model response containing flowchart instructions
 * @returns {Array} Array of parsed instructions
 */
export const parseAIFlowchartResponse = (response) => {
  const instructions = [];
  
  try {
    // Look for JSON blocks in the response
    const jsonMatches = response.match(/```json\s*([\s\S]*?)\s*```/g);
    
    if (jsonMatches) {
      jsonMatches.forEach(match => {
        const jsonContent = match.replace(/```json\s*|\s*```/g, '');
        try {
          const parsed = JSON.parse(jsonContent);
          if (Array.isArray(parsed)) {
            instructions.push(...parsed);
          } else if (parsed.flowchart && Array.isArray(parsed.flowchart)) {
            instructions.push(...parsed.flowchart);
          }
        } catch (e) {
          console.warn('Failed to parse JSON block:', e);
        }
      });
    }
    
    // Fallback: look for individual instruction patterns
    if (instructions.length === 0) {
      const lines = response.split('\n');
      let currentNode = null;
      
      lines.forEach(line => {
        line = line.trim();
        
        // Match create node patterns
        const createMatch = line.match(/create[_\s]node[:\s]+([^,]+),\s*type[:\s]+([^,]+)(?:,\s*label[:\s]+(.+))?/i);
        if (createMatch) {
          instructions.push({
            action: 'create_node',
            name: createMatch[1].trim(),
            type: createMatch[2].trim().toLowerCase(),
            label: createMatch[3] ? createMatch[3].trim() : createMatch[1].trim(),
          });
          return;
        }
        
        // Match connect nodes patterns
        const connectMatch = line.match(/connect[_\s]([^,]+)\s*(?:to|->)\s*([^,]+)(?:,\s*label[:\s]+(.+))?/i);
        if (connectMatch) {
          instructions.push({
            action: 'connect_nodes',
            from: connectMatch[1].trim(),
            to: connectMatch[2].trim(),
            label: connectMatch[3] ? connectMatch[3].trim() : null,
          });
          return;
        }
      });
    }
  } catch (error) {
    console.error('Error parsing AI flowchart response:', error);
  }
  
  return instructions;
};

/**
 * Validate flowchart instructions
 * @param {Array} instructions - Array of instructions to validate
 * @returns {Object} {valid, errors} validation result
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
      if (!instruction.name) {
        errors.push(`Instruction ${index}: Missing node name`);
      } else {
        nodeNames.add(instruction.name);
      }
      
      if (!instruction.type) {
        errors.push(`Instruction ${index}: Missing node type`);
      } else if (!['start', 'process', 'decision', 'end'].includes(instruction.type)) {
        errors.push(`Instruction ${index}: Invalid node type "${instruction.type}". Must be: start, process, decision, or end`);
      }
    } else if (instruction.action === 'connect_nodes') {
      if (!instruction.from || !instruction.to) {
        errors.push(`Instruction ${index}: Missing 'from' or 'to' node for connection`);
      }
    } else {
      errors.push(`Instruction ${index}: Unknown action "${instruction.action}"`);
    }
  });
  
  // Check that all referenced nodes in connections exist
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
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get system prompt for AI flowchart creation
 * @returns {string} System prompt
 */
export const getFlowchartSystemPrompt = () => {
  return `You are in flowchart creation mode. When the user requests a flowchart, respond with JSON instructions to create the flowchart programmatically.

Use this exact JSON format:
\`\`\`json
[
  {
    "action": "create_node",
    "name": "node_name",
    "type": "start|process|decision|end",
    "label": "Display text for the node"
  },
  {
    "action": "connect_nodes",
    "from": "source_node_name",
    "to": "target_node_name",
    "label": "optional_connection_label"
  }
]
\`\`\`

Node Types:
- "start": Beginning of the process (oval shape)
- "process": Regular process step (rectangle)
- "decision": Decision point (diamond shape)
- "end": End of the process (oval shape)

Rules:
1. Always start with at least one "start" node
2. End with at least one "end" node
3. Use "process" for regular steps
4. Use "decision" for yes/no or branching points
5. Node names should be unique and descriptive
6. Labels should be concise but clear
7. Create all nodes first, then add connections
8. Ensure logical flow from start to end

Example:
\`\`\`json
[
  {"action": "create_node", "name": "start", "type": "start", "label": "Begin Process"},
  {"action": "create_node", "name": "check_input", "type": "decision", "label": "Is input valid?"},
  {"action": "create_node", "name": "process_data", "type": "process", "label": "Process Data"},
  {"action": "create_node", "name": "show_error", "type": "process", "label": "Show Error"},
  {"action": "create_node", "name": "end", "type": "end", "label": "End"},
  {"action": "connect_nodes", "from": "start", "to": "check_input"},
  {"action": "connect_nodes", "from": "check_input", "to": "process_data", "label": "Yes"},
  {"action": "connect_nodes", "from": "check_input", "to": "show_error", "label": "No"},
  {"action": "connect_nodes", "from": "process_data", "to": "end"},
  {"action": "connect_nodes", "from": "show_error", "to": "end"}
]
\`\`\`

Always provide the JSON instructions, then give a brief explanation of the flowchart.`;
};