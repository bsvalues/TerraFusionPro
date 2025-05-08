/**
 * MLS Routes
 * API routes for MLS integration
 */

import express from 'express';
import * as mlsController from '../controllers/mls-controller';

const router = express.Router();

// MLS Systems
router.get('/systems', mlsController.getMlsSystems);
router.get('/systems/:id', mlsController.getMlsSystem);
router.post('/systems', mlsController.createMlsSystem);
router.put('/systems/:id', mlsController.updateMlsSystem);
router.delete('/systems/:id', mlsController.deleteMlsSystem);

// MLS Connection Testing
router.post('/systems/:id/test-connection', mlsController.testMlsConnection);

// MLS Property Search and Import
router.post('/systems/:id/search', mlsController.searchMlsProperties);
router.post('/systems/:id/import', mlsController.importMlsProperty);

// Field Mappings
router.get('/systems/:id/field-mappings', mlsController.getFieldMappings);
router.post('/systems/:id/field-mappings', mlsController.createFieldMapping);
router.put('/systems/:id/field-mappings/:mappingId', mlsController.updateFieldMapping);
router.delete('/systems/:id/field-mappings/:mappingId', mlsController.deleteFieldMapping);

export default router;