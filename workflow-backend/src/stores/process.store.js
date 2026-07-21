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

async function addFhirReferences(processId, refs) {

  return await ProcessModel.findOneAndUpdate(

    { processId },

    { $set: { fhirRefs: refs, updatedAt: new Date() } },

    { returnDocument: 'after' }

  );

}
async function listProcessesByStatus(status) {
  return await ProcessModel.find({ status }).sort({ createdAt: -1 });
}

module.exports = { createProcess, findProcessById, updateProcessStatus, addFhirReferences, listProcessesByStatus };