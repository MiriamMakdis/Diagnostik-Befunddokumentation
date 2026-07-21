const { z } = require('zod');

const processIdParamSchema = z.object({
  processId: z.string().min(1, 'processId fehlt.')
});

module.exports = {
  processIdParamSchema
};
