const express = require('express');

const requireAuth = require('../middlewares/requireAuth');
const requireScopes = require('../middlewares/requireScopes');

const { Scopes } = require('../constants/scopes');
const { listRadiologyWorklist } = require('../services/worklistService');

const router = express.Router();

router.get(
  '/worklist',
  requireAuth,
  requireScopes(Scopes.RADIOLOGY_WORKLIST_READ),
  async (req, res, next) => {
    try {
      const result = await listRadiologyWorklist({
        user: req.user
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
