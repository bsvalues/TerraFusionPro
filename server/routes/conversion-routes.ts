/**
 * TerraFusion Universal Conversion Agent Routes
 * API endpoints for data conversion services
 */

import { Router } from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

class UniversalConversionAgent {
    private rustAgentPath: string;
    private templatesPath: string;
    private dataPath: string;

    constructor() {
        this.rustAgentPath = path.join(process.cwd(), 'rust_agent');
        this.templatesPath = path.join(this.rustAgentPath, 'templates');
        this.dataPath = path.join(this.rustAgentPath, 'data');
    }

    async convertData(templateName: string, inputFile: string, outputFile?: string) {
        return new Promise((resolve, reject) => {
            const templatePath = path.join(this.templatesPath, templateName);
            const args = [
                '--template', templatePath,
                '--input', inputFile
            ];

            if (outputFile) {
                args.push('--output', outputFile);
            }

            const rustProcess = spawn('./target/release/universal_conversion_agent', args, {
                cwd: this.rustAgentPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            rustProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            rustProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            rustProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = outputFile ? 
                            { success: true, outputFile, message: 'Data converted successfully' } :
                            { success: true, data: JSON.parse(stdout) };
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Failed to parse output: ${error.message}`));
                    }
                } else {
                    reject(new Error(`Conversion failed: ${stderr || 'Unknown error'}`));
                }
            });

            rustProcess.on('error', (error) => {
                reject(new Error(`Failed to start conversion agent: ${error.message}`));
            });
        });
    }

    async processPropertyData(csvData: any[], templateName = 'sample_template.xml') {
        try {
            // Write CSV data to temporary file
            const tempCsvPath = path.join(this.dataPath, `temp_${Date.now()}.csv`);
            const csvContent = this.arrayToCsv(csvData);
            await fs.writeFile(tempCsvPath, csvContent, 'utf8');

            // Convert using Rust agent
            const result = await this.convertData(templateName, tempCsvPath);

            // Clean up temporary file
            await fs.unlink(tempCsvPath).catch(() => {});

            return {
                success: true,
                originalRecords: csvData.length,
                processedData: result.data,
                template: templateName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    arrayToCsv(data: any[]): string {
        if (!data || data.length === 0) return '';
        
        if (Array.isArray(data[0])) {
            // Array of arrays
            return data.map(row => row.join(',')).join('\n');
        } else {
            // Array of objects
            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                });
                csvRows.push(values.join(','));
            });
            
            return csvRows.join('\n');
        }
    }

    async isReady(): Promise<boolean> {
        try {
            const agentPath = path.join(this.rustAgentPath, 'target', 'release', 'universal_conversion_agent');
            await fs.access(agentPath);
            return true;
        } catch {
            return false;
        }
    }
}

const conversionAgent = new UniversalConversionAgent();

// Health check endpoint
router.get('/conversion/health', async (req, res) => {
    try {
        const isReady = await conversionAgent.isReady();
        res.json({
            status: 'ok',
            service: 'Universal Conversion Agent',
            rustAgentReady: isReady,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Convert property data for TerraFusion format
router.post('/conversion/property', async (req, res) => {
    try {
        const { properties, templateName } = req.body;
        
        if (!properties || !Array.isArray(properties)) {
            return res.status(400).json({
                success: false,
                error: 'Properties array is required'
            });
        }

        // Convert property objects to CSV format for processing
        const csvData = properties.map(prop => [
            prop.address || '',
            prop.price || 0,
            prop.sqft || 0,
            prop.bedrooms || 0
        ]);

        const result = await conversionAgent.processPropertyData(
            csvData,
            templateName || 'sample_template.xml'
        );

        res.json({
            ...result,
            terrafusionFormat: true,
            inputProperties: properties.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Convert CSV file upload
router.post('/conversion/convert', upload.single('csvFile'), async (req, res) => {
    try {
        const { templateName, csvData } = req.body;
        let dataToProcess;

        if (req.file) {
            // File upload - read CSV from uploaded file
            const csvContent = await fs.readFile(req.file.path, 'utf8');
            // Parse CSV content into array format
            const lines = csvContent.split('\n').filter(line => line.trim());
            dataToProcess = lines.map(line => line.split(','));
        } else if (csvData) {
            // JSON data provided
            dataToProcess = Array.isArray(csvData) ? csvData : [csvData];
        } else {
            return res.status(400).json({
                success: false,
                error: 'No CSV file or data provided'
            });
        }

        const result = await conversionAgent.processPropertyData(
            dataToProcess, 
            templateName || 'sample_template.xml'
        );

        // Clean up uploaded file
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;