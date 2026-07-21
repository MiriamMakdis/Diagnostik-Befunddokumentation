const ProcessModel = require('../models/process.model');

const { v4: uuidv4 } = require('uuid');

async function createProcess({ workflowType, organizationId, kvnrHash }) {

  const process = new ProcessModel({

    processId:      uuidv4(),
    transactionId:  uuidv4(),
    workflowType,
    organizationId,
    status:         'INTAKE_COMPLETED',
    kvnrHash,
    fhirRefs:       {}

  });

  return await process.save();

}

async function findProcessById(processId) {

  return await ProcessModel.findOne({ processId });

}

async function updateProcessStatus(processId, status) {

  return await ProcessModel.findOneAndUpdate(

    { processId },

    { status, updatedAt: new Date() },

    { returnDocument: 'after' }

  );

}

async function addFhirReferences(processId, refs = {}) {
  const setUpdate = {};
  const addToSetUpdate = {};

  const arrayFields = [
    'conditionRefs',
    'medicationStatementRefs',
    'observationRefs',
    'auditEventRefs',
    'provenanceRefs'
  ];

  Object.entries(refs).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (arrayFields.includes(key)) {
      const values = Array.isArray(value) ? value : [value];

      addToSetUpdate[`fhirRefs.${key}`] = {
        $each: values.filter(Boolean)
      };

      return;
    }

    setUpdate[`fhirRefs.${key}`] = value;
  });

  setUpdate.updatedAt = new Date();

  const update = {};

  if (Object.keys(setUpdate).length > 0) {
    update.$set = setUpdate;
  }

  if (Object.keys(addToSetUpdate).length > 0) {
    update.$addToSet = addToSetUpdate;
  }

  return await ProcessModel.findOneAndUpdate(
    { processId },
    update,
    { new: true }
  );
}

async function listProcessesByStatus(status) {
  return await ProcessModel.find({ status }).sort({ createdAt: -1 });
}

async function listProcessesByStatuses(statuses) {
  return ProcessModel.find({ status: { $in: statuses } }).sort({ createdAt: -1 });
}

module.exports = { createProcess, findProcessById, updateProcessStatus, addFhirReferences, listProcessesByStatus, listProcessesByStatuses };