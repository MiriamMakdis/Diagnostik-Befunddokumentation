const express = require('express');
const router = express.Router();

const { createAuditEventFHIR } = require('../audit/audit.service');
const AuditEventModel = require('../audit/auditEvent.schema');
const { listEventLogsByProcessId } = require('../stores/eventLog.store.js')
const { getDiagnosticWorkflowById, createDiagnosticReport, registerImagingStudy, createRadiologyOrder, startDiagnosticWorkflow } = require('../services/diagnosticWorkflowService.js')

const requireScopes = require("../middleware/requireScopes.js");
const validateRequest = require("../middleware/validateRequest.js");

const { Scopes } = require("../constants/scopes.js")
const workflowStatus = require("../constants/workflowStatus.js")

const requireAuth =  require("../middlewares/requireAuth.js");
const loadWorkflowProcess = require('../middlewares/loadWorkflowProcess.js');

//POST /diagnostic-workflows
router.post('/',
      requireAuth,
      requireScopes(Scopes.INTAKE_CREATE),
      validateRequest(something),
      loadWorkflowProcess,
      async (req, res, next) => {
        try {
            startDiagnosticWorkflow({
            processId: req.process.processId,
            status: req.process.status,
            fhirRefs: req.process.fhirRefs,
            });
        } catch (err) {
          next(error);
        }
    });


//POST /diagnostic-workflows/{id}/radiology-orders
router.post('/:id/radiology-orders',
      requireAuth,
      requireScopes(Scopes.RADIOLOGY_ORDER_CREATE),
      validateRequest(something),
      loadWorkflowProcess,
      async (req, res, next) => {
        req.params.id
        try {
            createRadiologyOrder({
            processId: req.process.processId,
            status: req.process.status,
            fhirRefs: req.process.fhirRefs,
            });
        } catch (err) {
          next(error);
        }
      });


//POST /diagnostic-workflows/{id}/imaging-studies
router.post('/:id/imaging-studies',
      requireAuth,
      requireScopes(Scopes.IMAGING_STUDY_CREATE),
      validateRequest(something),
      loadWorkflowProcess,
      async (req, res, next) => {
        req.params.id
        try {
            registerImagingStudy({
            processId: req.process.processId,
            status: req.process.status,
            fhirRefs: req.process.fhirRefs,
            });
        } catch (err) {
          next(error);
        }
      });

//POST /diagnostic-workflows/{id}/diagnostic-reports
router.post('/:id/diagnostic-reports',
      requireAuth,
      requireScopes(Scopes.DIAGNOSTIC_REPORT_CREATE),
      validateRequest(something),
      loadWorkflowProcess,
      async (req, res, next) => {
        req.params.id
        try {
            createDiagnosticReport();
        } catch (err) {
          next(error);
        }
      });

//GET /diagnostic-workflows/{id}/events
router.get('/:id/events',
      requireAuth,
      requireScopes(Scopes.AUDIT_READ),
      loadWorkflowProcess,

      async (req, res, next) => {
        req.params.id
        try {
          let gefunden = await listEventLogsByProcessId(req.params.id);

          res.status(200).json({
            message: 'EventLog zurückgegeben',
            id : req.params.id,
            eventLog: gefunden
          });
        } catch (err) {
          next(error);
        }
      }
);

//GET /diagnostic-workflows/{id}/fhir-references
router.get('/:id/fire-references',
      requireAuth,
      requireScopes(Scopes.FHIR_REFERENCES_READ),
      loadWorkflowProcess,

      async (req, res, next) => {
        req.params.id
        try {
          let gefunden = undefined;

          res.status(200).json({
            message: 'FhirReferenzen zurückgegeben',
            id : req.params.id,
            FhirReferences: gefunden
          });
        } catch (err) {
          next(error);
        }
      }
);


//GET /diagnostic-workflows/{id}/report-summary
router.get('/:id/report-summary',
      requireAuth,
      requireScopes(Scopes.REPORT_READ),
      loadWorkflowProcess,

      async (req, res, next) => {
        req.params.id
        try {
          let gefunden = await getDiagnosticWorkflowById(req.params.id);

          res.status(200).json({
            message: 'Befundübersicht zurückgegeben',
            id : req.params.id,
            diagnosticReport: gefunden
          });
        } catch (err) {
          next(error);
        }
      }
);



module.exports = router;


