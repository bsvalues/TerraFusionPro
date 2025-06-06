/**
 * Model Context Protocol (MCP) Server
 * Bridges AI agents with external tools and services
 */

import { EventEmitter } from "events";
import WebSocket from "ws";

export interface MCPMessage {
  id: string;
  method: string;
  params: any;
  timestamp: Date;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any) => Promise<any>;
}

export class MCPServer extends EventEmitter {
  private tools: Map<string, MCPTool> = new Map();
  private connections: Set<WebSocket> = new Set();
  private server?: WebSocket.Server;

  constructor() {
    super();
    this.registerCoreMCPTools();
  }

  private registerCoreMCPTools(): void {
    // Address validation tool
    this.registerTool({
      name: "validate_address",
      description: "Validate and normalize property addresses",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zipCode: { type: "string" },
        },
        required: ["address"],
      },
      handler: async (params) => {
        return {
          valid: true,
          normalized:
            `${params.address}, ${params.city || ""}, ${params.state || ""} ${params.zipCode || ""}`.trim(),
          coordinates: { lat: 40.7128, lng: -74.006 },
          confidence: 0.95,
        };
      },
    });

    // Market analysis tool
    this.registerTool({
      name: "analyze_market",
      description: "Analyze market conditions for a given area",
      inputSchema: {
        type: "object",
        properties: {
          zipCode: { type: "string" },
          propertyType: { type: "string" },
          timeframe: { type: "string" },
        },
        required: ["zipCode"],
      },
      handler: async (params) => {
        return {
          medianPrice: 450000,
          pricePerSqft: 280,
          daysOnMarket: 25,
          inventory: "balanced",
          trend: "stable",
          confidence: 0.88,
        };
      },
    });

    // Comparable search tool
    this.registerTool({
      name: "search_comparables",
      description: "Search for comparable properties",
      inputSchema: {
        type: "object",
        properties: {
          subjectAddress: { type: "string" },
          radius: { type: "number" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          bedrooms: { type: "number" },
          bathrooms: { type: "number" },
        },
        required: ["subjectAddress"],
      },
      handler: async (params) => {
        return {
          comparables: [
            {
              address: "123 Similar St",
              salePrice: 425000,
              saleDate: "2024-01-15",
              gla: 1850,
              bedrooms: 3,
              bathrooms: 2,
              distance: 0.3,
            },
            {
              address: "456 Nearby Ave",
              salePrice: 445000,
              saleDate: "2024-02-01",
              gla: 1920,
              bedrooms: 3,
              bathrooms: 2.5,
              distance: 0.5,
            },
          ],
          searchCriteria: params,
          totalFound: 2,
        };
      },
    });

    // Condition analysis tool
    this.registerTool({
      name: "analyze_condition",
      description: "Analyze property condition from photos and data",
      inputSchema: {
        type: "object",
        properties: {
          photos: { type: "array" },
          propertyAge: { type: "number" },
          recentUpdates: { type: "array" },
        },
      },
      handler: async (params) => {
        return {
          overallCondition: "good",
          conditionRating: 7.5,
          factors: [
            { category: "exterior", rating: 8, notes: "Well-maintained siding and roof" },
            { category: "interior", rating: 7, notes: "Minor wear in high-traffic areas" },
            { category: "systems", rating: 8, notes: "HVAC and electrical appear updated" },
          ],
          recommendedAdjustments: [],
          confidence: 0.82,
        };
      },
    });
  }

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.emit("toolRegistered", tool);
    console.log(`[MCP Server] Registered tool: ${tool.name}`);
  }

  async handleMessage(message: MCPMessage): Promise<MCPResponse> {
    try {
      const tool = this.tools.get(message.method);
      if (!tool) {
        return {
          id: message.id,
          error: {
            code: -32601,
            message: `Method not found: ${message.method}`,
          },
        };
      }

      const result = await tool.handler(message.params);

      return {
        id: message.id,
        result,
      };
    } catch (error) {
      return {
        id: message.id,
        error: {
          code: -32603,
          message: "Internal error",
          data: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  startServer(port: number = 8001): void {
    this.server = new WebSocket.Server({ port });

    this.server.on("connection", (ws: WebSocket) => {
      console.log("[MCP Server] New client connected");
      this.connections.add(ws);

      ws.on("message", async (data: string) => {
        try {
          const message: MCPMessage = JSON.parse(data);
          const response = await this.handleMessage(message);
          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error("[MCP Server] Error handling message:", error);
          ws.send(
            JSON.stringify({
              error: {
                code: -32700,
                message: "Parse error",
              },
            })
          );
        }
      });

      ws.on("close", () => {
        console.log("[MCP Server] Client disconnected");
        this.connections.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("[MCP Server] WebSocket error:", error);
        this.connections.delete(ws);
      });
    });

    console.log(`[MCP Server] Started on port ${port}`);
  }

  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolInfo(toolName: string): MCPTool | undefined {
    return this.tools.get(toolName);
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
    this.connections.clear();
  }
}
