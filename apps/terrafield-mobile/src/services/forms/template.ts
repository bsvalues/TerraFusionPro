import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Form } from '../../types/form';

export class FormTemplateService {
  private static instance: FormTemplateService;
  private templates: Map<string, Form> = new Map();

  private constructor() {}

  static getInstance(): FormTemplateService {
    if (!FormTemplateService.instance) {
      FormTemplateService.instance = new FormTemplateService();
    }
    return FormTemplateService.instance;
  }

  async loadTemplates(): Promise<void> {
    try {
      const templatePath = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/templates`,
        android: `${RNFS.ExternalDirectoryPath}/templates`,
      });

      if (!templatePath) {
        throw new Error('Platform not supported');
      }

      const exists = await RNFS.exists(templatePath);
      if (!exists) {
        await RNFS.mkdir(templatePath);
      }

      const files = await RNFS.readDir(templatePath);
      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.json')) {
          const content = await RNFS.readFile(file.path, 'utf8');
          const template = JSON.parse(content) as Form;
          this.templates.set(template.type, template);
        }
      }
    } catch (error) {
      console.error('Failed to load form templates:', error);
      throw error;
    }
  }

  async importLegacyTemplates(legacyPath: string): Promise<void> {
    try {
      const files = await RNFS.readDir(legacyPath);
      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.zip')) {
          await this.processLegacyTemplate(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to import legacy templates:', error);
      throw error;
    }
  }

  private async processLegacyTemplate(zipPath: string): Promise<void> {
    try {
      const tempDir = `${RNFS.CachesDirectoryPath}/temp_${Date.now()}`;
      await RNFS.mkdir(tempDir);
      await RNFS.unzip(zipPath, tempDir);

      const files = await RNFS.readDir(tempDir);
      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.xml')) {
          const content = await RNFS.readFile(file.path, 'utf8');
          const template = this.parseLegacyTemplate(content);
          if (template) {
            this.templates.set(template.type, template);
            await this.saveTemplate(template);
          }
        }
      }

      await RNFS.unlink(tempDir);
    } catch (error) {
      console.error('Failed to process legacy template:', error);
      throw error;
    }
  }

  private parseLegacyTemplate(content: string): Form | null {
    try {
      // Parse XML content and convert to Form type
      // This is a placeholder - actual implementation would depend on the XML structure
      const template: Form = {
        id: `template_${Date.now()}`,
        type: 'legacy',
        data: {},
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return template;
    } catch (error) {
      console.error('Failed to parse legacy template:', error);
      return null;
    }
  }

  private async saveTemplate(template: Form): Promise<void> {
    try {
      const templatePath = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/templates`,
        android: `${RNFS.ExternalDirectoryPath}/templates`,
      });

      if (!templatePath) {
        throw new Error('Platform not supported');
      }

      const filePath = `${templatePath}/${template.type}.json`;
      await RNFS.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  }

  getTemplate(type: string): Form | undefined {
    return this.templates.get(type);
  }

  getAllTemplates(): Form[] {
    return Array.from(this.templates.values());
  }
} 