const mongoose = require('mongoose');

const ErrorSchema = new mongoose.Schema({

  errorId:        { type: String, required: true, unique: true },
  processId:      { type: String },
  transactionId:  { type: String },
  organizationId: { type: String },
  actorSub:  { type: String },
  actorRole: { type: String },
  errorCode:  { type: String },
  httpStatus: { type: Number },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Error', ErrorSchema);