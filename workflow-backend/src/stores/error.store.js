const ErrorModel = require('../models/error.model');

const { v4: uuidv4 } = require('uuid');

async function saveError({ processId, transactionId, organizationId, actorSub, actorRole, errorCode, httpStatus, message }) {

  const error = new ErrorModel({

    errorId: uuidv4(),
    processId,
    transactionId,
    organizationId,
    actorSub,
    actorRole,
    errorCode,
    httpStatus,
    message

  });

  return await error.save();

}

async function findErrorsByProcessId(processId) {

  return await ErrorModel.find({ processId }).sort({ createdAt: 1 });

}

module.exports = { saveError, findErrorsByProcessId };