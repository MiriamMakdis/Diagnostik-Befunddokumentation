const Actions = Object.freeze({
  CREATE_RADIOLOGY_ORDER: "CREATE_RADIOLOGY_ORDER",
  REGISTER_IMAGING_STUDY: "REGISTER_IMAGING_STUDY",
  CREATE_DIAGNOSTIC_REPORT: "CREATE_DIAGNOSTIC_REPORT",
  NONE: "NONE",
});

const requiredStatusByAction = Object.freeze({
  [Actions.CREATE_RADIOLOGY_ORDER]: WorkflowStatus.INTAKE_COMPLETED,
  [Actions.REGISTER_IMAGING_STUDY]: WorkflowStatus.RADIOLOGY_ORDER_CREATED,
  [Actions.CREATE_DIAGNOSTIC_REPORT]: WorkflowStatus.IMAGING_STUDY_REGISTERED,
});

const targetStatusByAction = Object.freeze({
  [Actions.CREATE_RADIOLOGY_ORDER]: WorkflowStatus.RADIOLOGY_ORDER_CREATED,
  [Actions.REGISTER_IMAGING_STUDY]: WorkflowStatus.IMAGING_STUDY_REGISTERED,
  [Actions.CREATE_DIAGNOSTIC_REPORT]: WorkflowStatus.SUCCESS,
});

module.exports = {
    Actions,
    requiredStatusByAction,
    targetStatusByAction,
  };
