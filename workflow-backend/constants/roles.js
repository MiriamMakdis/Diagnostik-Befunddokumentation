const Roles = Object.freeze({
    ER_NURSE: 'ER_NURSE',
    ER_DOCTOR: 'ER_DOCTOR',
    RAD_TECH: 'RAD_TECH',
    RADIOLOGIST: 'RADIOLOGIST',
    AUDITOR: 'AUDITOR',
    ADMIN: 'ADMIN'
  });
  
  const roleLabels = Object.freeze({
    [Roles.ER_NURSE]: 'Pflegekraft Notaufnahme',
    [Roles.ER_DOCTOR]: 'Arzt Notaufnahme',
    [Roles.RAD_TECH]: 'Radiologie-Technik',
    [Roles.RADIOLOGIST]: 'Radiologe',
    [Roles.AUDITOR]: 'Auditor',
    [Roles.ADMIN]: 'Administrator'
  });

  
  module.exports = {
    Roles,
    roleLabels,
  };