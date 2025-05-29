/**
 * TerraFusion Agent Bus Core
 * Tokio-based async agent dispatcher and communication layer
 */

import { EventEmitter } from 'events';

export interface AgentMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
  priority: number;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities: AgentCapability[];
  status: 'active' | 'inactive' | 'error';
  lastHeartbeat?: Date;
}

export class AgentBus extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startMessageProcessor();
    this.registerCoreAgents();
  }

  private startMessageProcessor(): void {
    this.processingInterval = setInterval(() => {
      this.processMessageQueue();
    }, 100);
  }

  private registerCoreAgents(): void {
    // Comp Model Agent
    this.registerAgent({
      id: 'comp-model',
      name: 'Comparable Model Agent',
      type: 'validation',
      capabilities: [
        {
          name: 'comp-validation',
          description: 'Validate comparable property data',
          inputSchema: { properties: { address: 'string', price: 'number' } },
          outputSchema: { properties: { valid: 'boolean', adjustments: 'array' } }
        }
      ],
      status: 'active'
    });

    // Narrative Synthesis Agent
    this.registerAgent({
      id: 'narrative-synth',
      name: 'Narrative Synthesis Agent',
      type: 'generation',
      capabilities: [
        {
          name: 'narrative-generation',
          description: 'Generate property condition narratives',
          inputSchema: { properties: { propertyData: 'object' } },
          outputSchema: { properties: { narrative: 'string', confidence: 'number' } }
        }
      ],
      status: 'active'
    });

    // Risk Validator Agent
    this.registerAgent({
      id: 'risk-validator',
      name: 'Risk Validation Agent',
      type: 'analysis',
      capabilities: [
        {
          name: 'risk-analysis',
          description: 'Analyze value trends and risk factors',
          inputSchema: { properties: { marketData: 'object', propertyData: 'object' } },
          outputSchema: { properties: { riskLevel: 'string', factors: 'array' } }
        }
      ],
      status: 'active'
    });

    // Form Audit Agent
    this.registerAgent({
      id: 'form-audit',
      name: 'Form Audit Agent',
      type: 'compliance',
      capabilities: [
        {
          name: 'form-completeness',
          description: 'Check form completeness and compliance',
          inputSchema: { properties: { formData: 'object', template: 'object' } },
          outputSchema: { properties: { complete: 'boolean', missing: 'array', issues: 'array' } }
        }
      ],
      status: 'active'
    });
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.emit('agentRegistered', agent);
    console.log(`[Agent Bus] Registered agent: ${agent.name} (${agent.id})`);
  }

  publish(message: Partial<AgentMessage>): void {
    const fullMessage: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: message.type || 'unknown',
      source: message.source || 'system',
      target: message.target,
      payload: message.payload || {},
      timestamp: new Date(),
      priority: message.priority || 1
    };

    this.messageQueue.push(fullMessage);
    this.emit('messagePublished', fullMessage);
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    // Sort by priority (higher number = higher priority)
    this.messageQueue.sort((a, b) => b.priority - a.priority);

    const message = this.messageQueue.shift();
    if (!message) return;

    this.routeMessage(message);
  }

  private async routeMessage(message: AgentMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'FieldUpdate':
          await this.handleFieldUpdate(message);
          break;
        case 'ValidationRequest':
          await this.handleValidationRequest(message);
          break;
        case 'NarrativeRequest':
          await this.handleNarrativeRequest(message);
          break;
        case 'RiskAnalysis':
          await this.handleRiskAnalysis(message);
          break;
        case 'FinalValidation':
          await this.handleFinalValidation(message);
          break;
        default:
          console.warn(`[Agent Bus] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[Agent Bus] Error processing message:`, error);
      this.emit('messageError', { message, error });
    }
  }

  private async handleFieldUpdate(message: AgentMessage): Promise<void> {
    const { fieldId, value, formData } = message.payload;

    // Route to appropriate agents based on field type
    if (fieldId.includes('price') || fieldId.includes('comp')) {
      await this.invokeAgent('comp-model', {
        type: 'field-validation',
        fieldId,
        value,
        formData
      });
    }

    if (fieldId.includes('address')) {
      await this.invokeAgent('risk-validator', {
        type: 'location-analysis',
        fieldId,
        value,
        formData
      });
    }
  }

  private async handleValidationRequest(message: AgentMessage): Promise<void> {
    const { agentId, data } = message.payload;
    await this.invokeAgent(agentId, data);
  }

  private async handleNarrativeRequest(message: AgentMessage): Promise<void> {
    await this.invokeAgent('narrative-synth', message.payload);
  }

  private async handleRiskAnalysis(message: AgentMessage): Promise<void> {
    await this.invokeAgent('risk-validator', message.payload);
  }

  private async handleFinalValidation(message: AgentMessage): Promise<void> {
    const { agentId, formData } = message.payload;
    await this.invokeAgent(agentId, {
      type: 'final-validation',
      formData
    });
  }

  private async invokeAgent(agentId: string, data: any): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`[Agent Bus] Agent not found: ${agentId}`);
      return;
    }

    if (agent.status !== 'active') {
      console.warn(`[Agent Bus] Agent not active: ${agentId}`);
      return;
    }

    // Mock agent processing - in production this would call actual agent services
    const result = await this.mockAgentInvocation(agentId, data);
    
    this.emit('agentResponse', {
      agentId,
      data,
      result,
      timestamp: new Date()
    });
  }

  private async mockAgentInvocation(agentId: string, data: any): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    switch (agentId) {
      case 'comp-model':
        return {
          valid: true,
          adjustments: [
            { factor: 'GLA', amount: 2500, reasoning: 'Subject 150 sq ft larger' },
            { factor: 'Condition', amount: -1000, reasoning: 'Comp in better condition' }
          ],
          confidence: 0.85
        };

      case 'narrative-synth':
        return {
          narrative: 'Property is in good condition with recent updates to kitchen and bathrooms. Comparable properties in the area show strong market activity.',
          confidence: 0.92,
          keyPoints: ['Recent updates', 'Strong market', 'Good condition']
        };

      case 'risk-validator':
        return {
          riskLevel: 'low',
          factors: [
            { type: 'market-stability', impact: 'positive', description: 'Stable appreciation trend' },
            { type: 'location', impact: 'positive', description: 'Desirable neighborhood' }
          ],
          confidence: 0.78
        };

      case 'form-audit':
        return {
          complete: false,
          missing: ['comp_2_address', 'comp_3_address'],
          issues: ['Consider adding more recent comparables'],
          compliance: 0.75
        };

      default:
        return { processed: true, agentId };
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === 'active');
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.removeAllListeners();
  }
}