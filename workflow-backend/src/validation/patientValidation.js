const { z } = require('zod');

const patientSearchSchema = {
  body: z.object({
    kvnr: z.string().min(1).optional(),
    kvid: z.string().min(1).optional(),

    familyName: z.string().min(1).optional(),
    givenName: z.string().min(1).optional(),
    birthDate: z.string().min(1).optional()
  }).refine((body) => {
    const hasKvnr = Boolean(body.kvnr || body.kvid);
    const hasNameSearch = Boolean(body.familyName || body.givenName || body.birthDate);

    return hasKvnr || hasNameSearch;
  }, {
    message: 'Es muss entweder eine KVNR/KVID oder mindestens ein Suchkriterium angegeben werden.'
  })
};

module.exports = {
  patientSearchSchema
};
