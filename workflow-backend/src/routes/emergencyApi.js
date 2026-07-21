const express = require('express');
const router = express.Router();


const { createAuditEventFHIR } = require('../audit/audit.service');
const AuditEventModel = require('../audit/auditEvent.schema');
const { listProcessesByStatus } = require('../stores/process.store.js')

const requireScopes = require("../middleware/requireScopes.js");
const validateRequest = require("../middleware/validateRequest.js");

const { Scopes } = require("../constants/scopes.js")
const workflowStatus = require("../constants/workflowStatus.js")

const requireAuth =  require("../middlewares/requireAuth.js");
const loadWorkflowProcess = require('../middlewares/loadWorkflowProcess.js');

//GET emergency/worklist/
router.get('/worklist',
      requireAuth,
      requireScopes(Scopes.EMERGENCY_WORKLIST_READ),
      loadWorkflowProcess,

      async (req, res, next) => {
        try {
          let gefunden = await listProcessesByStatus(workflowStatus.INTAKE_COMPLETED);

          res.status(200).json({
            message: 'workList zurückgegeben',
            workList: gefunden
          });
        } catch (err) {
          next(error);
        }
      }
);

module.exports = router;
