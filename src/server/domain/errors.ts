/**
 * Domain Error Classes
 * Stable error types that map to HTTP status codes
 */

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, identifier: string) {
    super('NOT_FOUND', `${entity} not found: ${identifier}`, { entity, identifier });
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super('INVALID_TRANSITION', `Cannot transition ${entity} from ${from} to ${to}`, {
      entity,
      from,
      to,
    });
  }
}

export class ForbiddenError extends DomainError {
  constructor(action: string, reason?: string) {
    super('FORBIDDEN', `Action '${action}' is not allowed${reason ? `: ${reason}` : ''}`, {
      action,
      reason,
    });
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, details);
  }
}

export class InsufficientPaymentError extends DomainError {
  constructor(invoiceId: string, required: number, provided: number) {
    super('INSUFFICIENT_PAYMENT', `Payment amount insufficient for invoice ${invoiceId}`, {
      invoiceId,
      required,
      provided,
    });
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BUSINESS_RULE_VIOLATION', message, details);
  }
}
