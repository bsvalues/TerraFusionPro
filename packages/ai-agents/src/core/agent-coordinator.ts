import { Agent, AgentTask, AgentTaskResult } from '../interfaces/agent';

/**
 * Agent Coordinator
 * 
 * Manages a group of AI agents, routes tasks to the appropriate agent,
 * and handles agent communication and coordination.
 */
export class AgentCoordinator {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: AgentTask<any>[] = [];
  private processing: boolean = false;
  private taskResults: Map<string, AgentTaskResult<any>> = new Map();
  
  /**
   * Register an agent with the coordinator
   * @param agent The agent to register
   */
  registerAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered`);
    }
    
    this.agents.set(agent.id, agent);
    console.log(`[Agent Coordinator] Registering agent "${agent.name}" (${agent.id})`);
  }
  
  /**
   * Unregister an agent from the coordinator
   * @param agentId The ID of the agent to unregister
   */
  unregisterAgent(agentId: string): boolean {
    console.log(`[Agent Coordinator] Unregistering agent with ID ${agentId}`);
    return this.agents.delete(agentId);
  }
  
  /**
   * Get an agent by ID
   * @param agentId The ID of the agent to get
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all registered agents
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Submit a task to be executed by the appropriate agent
   * @param task The task to submit
   */
  async submitTask<T = any, R = any>(task: AgentTask<T>): Promise<string> {
    // Add a created timestamp if not provided
    const taskWithTimestamp = {
      ...task,
      createdAt: task.createdAt || new Date(),
    };
    
    // Add the task to the queue
    this.taskQueue.push(taskWithTimestamp);
    
    // Sort the queue by priority
    this.taskQueue.sort((a, b) => a.priority - b.priority);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processTasks();
    }
    
    // Return the task ID
    return task.id;
  }
  
  /**
   * Process tasks in the queue
   */
  private async processTasks(): Promise<void> {
    // Set processing flag to true
    this.processing = true;
    
    // Process tasks until the queue is empty
    while (this.taskQueue.length > 0) {
      // Get the next task
      const task = this.taskQueue.shift();
      
      if (!task) {
        continue;
      }
      
      // Check if the task is scheduled for the future
      if (task.scheduledFor && task.scheduledFor > new Date()) {
        // Put it back in the queue
        this.taskQueue.push(task);
        
        // Sort the queue again
        this.taskQueue.sort((a, b) => a.priority - b.priority);
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // Find an agent that can handle the task
      const agent = this.findAgentForTask(task);
      
      if (!agent) {
        // No agent can handle this task
        const result: AgentTaskResult<any> = {
          id: `result-${task.id}`,
          taskId: task.id,
          success: false,
          error: `No agent available to handle task of type ${task.type}`,
          startedAt: new Date(),
          completedAt: new Date(),
        };
        
        this.taskResults.set(task.id, result);
        continue;
      }
      
      try {
        // Execute the task with the agent
        const result = await agent.executeTask(task);
        
        // Store the result
        this.taskResults.set(task.id, result);
      } catch (error) {
        // Create an error result
        const result: AgentTaskResult<any> = {
          id: `result-${task.id}`,
          taskId: task.id,
          success: false,
          error: error.message || 'Unknown error',
          startedAt: new Date(),
          completedAt: new Date(),
        };
        
        // Store the result
        this.taskResults.set(task.id, result);
      }
    }
    
    // Set processing flag to false
    this.processing = false;
  }
  
  /**
   * Find an agent that can handle a specific task
   * @param task The task to find an agent for
   */
  private findAgentForTask(task: AgentTask<any>): Agent | undefined {
    // If a specific agent is requested in the context, use that
    if (task.context?.agentId) {
      const agent = this.agents.get(task.context.agentId);
      
      if (agent && agent.canHandleTask(task)) {
        return agent;
      }
    }
    
    // Otherwise, find the first agent that can handle the task
    for (const agent of this.agents.values()) {
      if (agent.canHandleTask(task)) {
        return agent;
      }
    }
    
    // No agent can handle this task
    return undefined;
  }
  
  /**
   * Get the result of a task
   * @param taskId The ID of the task
   */
  getTaskResult<R = any>(taskId: string): AgentTaskResult<R> | undefined {
    return this.taskResults.get(taskId) as AgentTaskResult<R> | undefined;
  }
  
  /**
   * Check if a task has been completed
   * @param taskId The ID of the task
   */
  isTaskComplete(taskId: string): boolean {
    return this.taskResults.has(taskId);
  }
  
  /**
   * Wait for a task to complete and get the result
   * @param taskId The ID of the task
   * @param timeout Optional timeout in milliseconds
   */
  async waitForTaskCompletion<R = any>(
    taskId: string,
    timeout?: number
  ): Promise<AgentTaskResult<R>> {
    // Check if the task is already complete
    if (this.isTaskComplete(taskId)) {
      return this.getTaskResult<R>(taskId)!;
    }
    
    // Set up a promise that resolves when the task completes
    return new Promise<AgentTaskResult<R>>((resolve, reject) => {
      // Set up a timeout if provided
      const timeoutId = timeout
        ? setTimeout(() => {
            clearInterval(intervalId);
            reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
          }, timeout)
        : undefined;
      
      // Check for task completion periodically
      const intervalId = setInterval(() => {
        if (this.isTaskComplete(taskId)) {
          clearInterval(intervalId);
          
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          resolve(this.getTaskResult<R>(taskId)!);
        }
      }, 100);
    });
  }
}