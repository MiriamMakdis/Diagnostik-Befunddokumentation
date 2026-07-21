const { z } = require('zod');
const { processIdParamSchema } = require('./commonValidation');

const startWorkflowSchema = {
  body: z.object({
    patient: z.object({
      kvnr: z.string().min(1).optional(),
      kvid: z.string().min(1).optional(),

      firstName: z.string().min(1).optional(),
      givenName: z.string().min(1).optional(),

      lastName: z.string().min(1).optional(),
      familyName: z.string().min(1).optional(),

      birthDate: z.string().min(1),
      gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
    }),

    consent: z.object({
      accepted: z.boolean()
    }),

    conditions: z.array(
      z.object({
        icdCode: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        icdDisplay: z.string().min(1).optional(),
        display: z.string().min(1).optional()
      })
    ).optional(),

    medications: z.array(
      z.object({
        medicationText: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        dosageText: z.string().min(1).optional(),
        dosage: z.string().min(1).optional(),
        status: z.string().min(1).optional()
      })
    ).optional()
  }).passthrough()
};

const processOnlySchema = {
  params: processIdParamSchema
};

const radiologyOrderSchema = {
  params: processIdParamSchema,
  body: z.object({
    procedureCode: z.string().min(1).optional(),
    procedureDisplay: z.string().min(1).optional(),

    orderCode: z.string().min(1).optional(),
    orderDisplay: z.string().min(1).optional(),

    bodySiteCode: z.string().min(1).optional(),
    bodySiteDisplay: z.string().min(1).optional(),

    reason: z.string().min(1).optional()
  }).passthrough()
};

const imagingStudySchema = {
  params: processIdParamSchema,
  body: z.object({
    studyInstanceUid: z.string().min(1).optional(),
    modalityCode: z.string().min(1).optional(),
    modalityDisplay: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    started: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    imageReference: z.string().min(1).optional()
  }).passthrough()
};

const diagnosticReportSchema = {
  params: processIdParamSchema,
  body: z.object({
    conclusion: z.string().min(1),
    status: z.string().min(1).optional(),
    findings: z.array(
      z.object({
        code: z.string().min(1).optional(),
        display: z.string().min(1).optional(),

        valueCode: z.string().min(1).optional(),
        valueDisplay: z.string().min(1).optional(),
        valueString: z.string().min(1).optional(),

        interpretationCode: z.string().min(1).optional(),
        interpretationDisplay: z.string().min(1).optional(),
        effectiveDateTime: z.string().min(1).optional()
      }).passthrough()
    ).optional()
  }).passthrough()
};

module.exports = {
  startWorkflowSchema,
  processOnlySchema,
  radiologyOrderSchema,
  imagingStudySchema,
  diagnosticReportSchema
};
