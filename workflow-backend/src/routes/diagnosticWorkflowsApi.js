const express = require('express');

const requireAuth = require('../middlewares/requireAuth');
const requireScopes = require('../middlewares/requireScopes');
const validateRequest = require('../middlewares/validateRequests');
const loadWorkflowProcess = require('../middlewares/loadWorkflowProcess');

const { Scopes } = require('../constants/scopes');

const {
  startWorkflowSchema,
  processOnlySchema,
  radiologyOrderSchema,
  imagingStudySchema,
  diagnosticReportSchema
} = require('../validation/workflowValidation');

const {
  startDiagnosticWorkflow,
  getDiagnosticWorkflowById,
  createRadiologyOrder,
  registerImagingStudy,
  createDiagnosticReport
} = require('../services/diagnosticWorkflowService');

const { getWorkflowContext } = require('../services/contextService');
const { getReportSummary } = require('../services/reportService');
const { listEventLogsByProcessId } = require('../stores/eventLog.store');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireScopes(Scopes.INTAKE_CREATE),
  validateRequest(startWorkflowSchema),
  async (req, res, next) => {
    try {
      const result = await startDiagnosticWorkflow({
        user: req.user,
        input: req.body
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:processId',
  requireAuth,
  requireScopes(Scopes.WORKFLOW_READ),
  validateRequest(processOnlySchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const result = await getDiagnosticWorkflowById({
        processId: req.params.processId,
        user: req.user
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:processId/context',
  requireAuth,
  requireScopes(Scopes.CONTEXT_READ),
  validateRequest(processOnlySchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const result = await getWorkflowContext({
        processId: req.params.processId,
        user: req.user,
        process: req.process
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:processId/radiology-orders',
  requireAuth,
  requireScopes(Scopes.RADIOLOGY_ORDER_CREATE),
  validateRequest(radiologyOrderSchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const result = await createRadiologyOrder({
        user: req.user,
        process: req.process,
        processId: req.params.processId,
        input: req.body
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:processId/imaging-studies',
  requireAuth,
  requireScopes(Scopes.IMAGING_STUDY_CREATE),
  validateRequest(imagingStudySchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const result = await registerImagingStudy({
        user: req.user,
        process: req.process,
        processId: req.params.processId,
        input: req.body
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:processId/diagnostic-reports',
  requireAuth,
  requireScopes(Scopes.DIAGNOSTIC_REPORT_CREATE),
  validateRequest(diagnosticReportSchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const result = await createDiagnosticReport({
        user: req.user,
        process: req.process,
        processId: req.params.processId,
        input: req.body
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:processId/report-summary',
  requireAuth,
  requireScopes(Scopes.REPORT_READ),
  validateRequest(processOnlySchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const result = await getReportSummary({
        processId: req.params.processId,
        user: req.user,
        process: req.process
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:processId/events',
  requireAuth,
  requireScopes(Scopes.AUDIT_READ),
  validateRequest(processOnlySchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      const events = await listEventLogsByProcessId(req.params.processId);

      res.status(200).json({
        status: 'SUCCESS',
        processId: req.params.processId,
        events
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:processId/fhir-references',
  requireAuth,
  requireScopes(Scopes.FHIR_REFERENCES_READ),
  validateRequest(processOnlySchema),
  loadWorkflowProcess,
  async (req, res, next) => {
    try {
      res.status(200).json({
        status: 'SUCCESS',
        processId: req.params.processId,
        fhirRefs: req.process.fhirRefs || {}
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
