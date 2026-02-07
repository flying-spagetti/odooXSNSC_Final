/**
 * Error Handler Plugin
 * Maps domain errors to HTTP status codes and provides consistent error responses
 */

import { FastifyPluginAsync, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  InvalidTransitionError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
  InsufficientPaymentError,
  BusinessRuleError,
} from '../domain/errors';

interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError | DomainError | Error, request, reply) => {
    let statusCode = 500;
    let errorResponse: ErrorResponse;

    // Handle domain errors
    if (error instanceof DomainError) {
      errorResponse = error.toJSON();

      // Map domain errors to HTTP status codes
      if (error instanceof ValidationError) {
        statusCode = 400;
      } else if (error instanceof UnauthorizedError) {
        statusCode = 401;
      } else if (error instanceof ForbiddenError) {
        statusCode = 403;
      } else if (error instanceof NotFoundError) {
        statusCode = 404;
      } else if (error instanceof ConflictError || error instanceof InvalidTransitionError) {
        statusCode = 409;
      } else if (
        error instanceof BusinessRuleError ||
        error instanceof InsufficientPaymentError
      ) {
        statusCode = 422;
      } else {
        statusCode = 500;
      }
    }
    // Handle Fastify validation errors
    else if ('validation' in error && error.validation) {
      statusCode = 400;
      errorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { validation: error.validation },
      };
    }
    // Handle generic errors
    else {
      statusCode = error.statusCode || 500;
      errorResponse = {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      };
    }

    // Log errors
    if (statusCode >= 500) {
      fastify.log.error(
        {
          err: error,
          req: {
            method: request.method,
            url: request.url,
            headers: request.headers,
          },
        },
        'Internal server error'
      );
    } else {
      fastify.log.warn(
        {
          err: error,
          req: {
            method: request.method,
            url: request.url,
          },
        },
        `Request error: ${error.message}`
      );
    }

    reply.status(statusCode).send(errorResponse);
  });

  fastify.log.info('Error handler registered');
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
});
