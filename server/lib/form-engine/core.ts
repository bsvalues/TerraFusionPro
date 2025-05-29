/**
 * TerraFusion Form Engine Core
 * Form-first architecture with real-time agent validation
 */

import { EventEmitter } from 'events';

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'comp' | 'address';
  label: string;
  value: any;
  required: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    custom?: string;
  };
  agentHints?: string[];
  dependencies?: string[];
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  type: 'URAR' | 'TOTAL' | 'ClickForms' | 'ACI' | 'Custom';
  sections: FormSection[];
  validation: FormValidation;
  agents: string[];
}

export interface FormValidation {
  rules: ValidationRule[];
  agentChecks: AgentCheck[];
}

export interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'pattern' | 'range' | 'custom';
  value: any;
  message: string;
}

export interface AgentCheck {
  agentId: string;
  trigger: 'onChange' | 'onComplete' | 'onSubmit';
  fields: string[];
}

export interface FormInstance {
  id: string;
  templateId: string;
  data: Record<string, any>;
  status: 'draft' | 'validating' | 'complete' | 'submitted';
  validationResults: ValidationResult[];
  agentFeedback: AgentFeedback[];
  createdAt: Date;
  updatedAt: Date;
  hash?: string;
  signature?: string;
}

export interface ValidationResult {
  fieldId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  timestamp: Date;
}

export interface AgentFeedback {
  agentId: string;
  fieldId?: string;
  type: 'validation' | 'suggestion' | 'narrative' | 'comp' | 'risk';
  content: any;
  confidence: number;
  timestamp: Date;
}

export class FormEngine extends EventEmitter {
  private templates: Map<string, FormTemplate> = new Map();
  private instances: Map<string, FormInstance> = new Map();

  constructor() {
    super();
    this.loadDefaultTemplates();
  }



  private loadDefaultTemplates(): void {
    const urarTemplate: FormTemplate = {
      id: 'urar-standard',
      name: 'URAR Standard Form',
      type: 'URAR',
      sections: [
        {
          id: 'subject-property',
          title: 'Subject Property Information',
          order: 1,
          fields: [
            {
              id: 'property_address',
              type: 'address',
              label: 'Property Address',
              value: '',
              required: true,
              agentHints: ['address-validation', 'geo-lookup'],
              validation: {
                pattern: '^[0-9]+\\s+[A-Za-z0-9\\s,.-]+$'
              }
            },
            {
              id: 'legal_description',
              type: 'textarea',
              label: 'Legal Description',
              value: '',
              required: true,
              agentHints: ['legal-validation']
            },
            {
              id: 'sale_price',
              type: 'number',
              label: 'Sale Price',
              value: 0,
              required: true,
              agentHints: ['market-validation', 'price-analysis'],
              validation: {
                min: 0,
                max: 50000000
              }
            }
          ]
        }
      ],
      validation: {
        rules: [
          {
            id: 'address-required',
            field: 'property_address',
            type: 'required',
            value: true,
            message: 'Property address is required'
          }
        ],
        agentChecks: [
          {
            agentId: 'comp-model',
            trigger: 'onChange',
            fields: ['sale_price']
          }
        ]
      },
      agents: ['comp-model', 'narrative-synth', 'risk-validator', 'form-audit']
    };

    this.templates.set(urarTemplate.id, urarTemplate);
  }

  createForm(templateId: string, initialData?: Record<string, any>): FormInstance {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const formId = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const instance: FormInstance = {
      id: formId,
      templateId,
      data: initialData || {},
      status: 'draft',
      validationResults: [],
      agentFeedback: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.instances.set(formId, instance);
    this.emit('formCreated', instance);
    
    return instance;
  }

  updateField(formId: string, fieldId: string, value: any): void {
    const instance = this.instances.get(formId);
    if (!instance) {
      throw new Error(`Form not found: ${formId}`);
    }

    instance.data[fieldId] = value;
    instance.updatedAt = new Date();

    // Emit field update for agent processing
    this.emit('fieldUpdated', { formId, fieldId, value, formData: instance.data });
  }

  async submitForm(formId: string): Promise<{ hash: string; signature: string }> {
    const instance = this.instances.get(formId);
    if (!instance) {
      throw new Error(`Form not found: ${formId}`);
    }

    const hash = await this.generateFormHash(instance);
    const signature = await this.signForm(hash);

    instance.hash = hash;
    instance.signature = signature;
    instance.status = 'submitted';
    instance.updatedAt = new Date();

    this.emit('formSubmitted', instance);

    return { hash, signature };
  }

  private async generateFormHash(instance: FormInstance): Promise<string> {
    const crypto = await import('crypto');
    const content = JSON.stringify({
      templateId: instance.templateId,
      data: instance.data,
      timestamp: instance.updatedAt.toISOString()
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async signForm(hash: string): Promise<string> {
    return `sig_${hash.substring(0, 16)}_${Date.now()}`;
  }

  getForm(formId: string): FormInstance | undefined {
    return this.instances.get(formId);
  }

  getTemplate(templateId: string): FormTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): FormTemplate[] {
    return Array.from(this.templates.values());
  }
}