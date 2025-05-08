/**
 * MLS Routes
 * Handles API endpoints for MLS integration
 */
import express, { Router } from 'express';
import * as mlsController from '../controllers/mls-controller';

const router = Router();

// MLS Systems routes
router.get('/systems', mlsController.getMlsSystems);
router.get('/systems/:id', mlsController.getMlsSystem);
router.post('/systems', mlsController.createMlsSystem);
router.put('/systems/:id', mlsController.updateMlsSystem);
router.delete('/systems/:id', mlsController.deleteMlsSystem);
router.post('/systems/:id/test-connection', mlsController.testMlsConnection);

// MLS Property Search routes
router.post('/search', mlsController.searchMlsProperties);
router.post('/import', mlsController.importMlsProperty);

// Field Mappings routes
router.get('/field-mappings', mlsController.getFieldMappings);
router.post('/field-mappings', mlsController.createFieldMapping);
router.put('/field-mappings/:id', mlsController.updateFieldMapping);
router.delete('/field-mappings/:id', mlsController.deleteFieldMapping);

export default router;