'use strict';

const { validateData } = require('./schema');

function validateRequest(schema, { source = 'body', lang = 'en' } = {}) {
  return async function preHandler(request, reply) {
    const { valid, errors, data } = validateData(request[source], schema, { lang });
    if (!valid) return reply.code(400).send({ error: 'Validation failed', errors });
    request.validated = data;
  };
}

module.exports = { validateRequest };
