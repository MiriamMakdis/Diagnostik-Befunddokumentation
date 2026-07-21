const express = require('express');

const requireAuth = require('../middlewares/requireAuth');
const requireScopes = require('../middlewares/requireScopes');

const { Scopes } = require('../constants/scopes');
const { listEmergencyWorklist } = require('../services/worklistService');

const router = express.Router();

router.get(
  '/worklist',
  requireAuth,
  requireScopes(Scopes.EMERGENCY_WORKLIST_READ),
  async (req, res, next) => {
    try {
      const result = await listEmergencyWorklist({
        user: req.user
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
