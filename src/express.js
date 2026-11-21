'use strict';

const { validateData } = require('./schema');

/**
 * Express/Connect middleware that validates req.body (or query/params).
 *
 *   const { validateRequest } = require('bharat-utils/express');
 *   app.post('/kyc', validateRequest({ pan: 'pan', mobile: 'mobile' }), handler);
 *
 * On failure responds 400 { error, errors }. On success the normalized values
 * are available as req.validated.
 */
function validateRequest(schema, options = {}) {
  const { source = 'body', lang = 'en' } = options;
  return function bharatValidate(req, res, next) {
    if (req[source] === undefined) {
      const hint = source === 'body' ? ' Install a body parser such as express.json() before validation.' : '';
      return res.status(400).json({ error: `Missing request ${source}.${hint}`, errors: {} });
    }
    const result = validateData(req[source], schema, { lang });
    if (!result.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: result.errors });
    }
    req.validated = result.data;
    return next();
  };
}

module.exports = { validateRequest };
