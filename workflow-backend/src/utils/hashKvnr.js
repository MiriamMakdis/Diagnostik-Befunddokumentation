const crypto = require('crypto');

const hashKvnr = (kvnr) => {
    if (!kvnr) {
      return null;
    }
  
    const pepper = process.env.KVNR_HASH_PEPPER || 'demo-pepper';
  
    return crypto
      .createHash('sha256')
      .update(`${kvnr}:${pepper}`)
      .digest('hex');
  };

  module.exports = hashKvnr;