const demoUsers = [
    {
      sub: 'user-pflege-1',
      username: 'pflege',
      password: 'demo',
      role: 'ER_NURSE',
      
      scopes: [
        'patient:search',
        'intake:create',
        'workflow:read',
        'emergency-worklist:read'
      ]
    },
    {
      sub: 'user-arzt-1',
      username: 'arzt',
      password: 'demo',
      role: 'ER_DOCTOR',
      
      scopes: [
        'patient:search',
        'workflow:read',
        'context:read',
        'radiology-order:create',
        'emergency-worklist:read',
        'report:read'
      ]
    },
    {
      sub: 'user-radiologie-1',
      username: 'radiologie',
      password: 'demo',
      role: 'RAD_TECH',
      
      scopes: [
        'workflow:read',
        'context:read',
        'radiology-worklist:read',
        'imaging-study:create'
      ]
    },
    {
      sub: 'user-radiologe-1',
      username: 'radiologe',
      password: 'demo',
      role: 'RADIOLOGIST',
      
      scopes: [
        'workflow:read',
        'context:read',
        'radiology-worklist:read',
        'diagnostic-report:create',
        'report:read'
      ]
    },
    {
      sub: 'user-auditor-1',
      username: 'auditor',
      password: 'demo',
      role: 'AUDITOR',
      
      scopes: [
        'workflow:read',
        'audit:read',
        'fhir-references:read'
      ]
    }
  ];

export default demoUsers;