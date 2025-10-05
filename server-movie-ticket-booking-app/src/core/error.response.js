"use strict";

// const logger = require("../loggers/winston.log");
// const myLogger = require("../loggers/mylogger.log");
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const statusCode = {
  FORBIDDEN: 403,
  CONFLICT: 409,
};

const responseStatusCode = {
  FORBIDDEN: "Bad request error",
  CONFLICT: "Conflict error",
};

class ErrorResponse extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.now = Date.now();
    // Log the error use winston
    // logger.error(`${this.status} - ${this.message}`);
    // myLogger.error(this.message, ["api/v1/login", "aabbcc", { error: "Bad request error" }]);
  }
}

class ConflictRequestError extends ErrorResponse {
  constructor(message = responseStatusCode.CONFLICT, status = statusCode.FORBIDDEN) {
    super(message, status);
  }
}

class BadRequestError extends ErrorResponse {
  constructor(message = ReasonPhrases.BAD_REQUEST, status = StatusCodes.BAD_REQUEST) {
    super(message, status);
  }
}

class AuthFailureError extends ErrorResponse {
  constructor(message = ReasonPhrases.UNAUTHORIZED, status = StatusCodes.UNAUTHORIZED) {
    super(message, status);
  }
}

class NotFoundError extends ErrorResponse {
  constructor(message = ReasonPhrases.NOT_FOUND, status = StatusCodes.NOT_FOUND) {
    super(message, status);
  }
}

class ForbiddenError extends ErrorResponse {
  constructor(message = ReasonPhrases.FORBIDDEN, status = StatusCodes.FORBIDDEN) {
    super(message, status);
  }
}

class RedisErrorResponse extends ErrorResponse {
  constructor(message = ReasonPhrases.INTERNAL_SERVER_ERROR, status = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

class ServerErrorResponse extends ErrorResponse {
  constructor(message = ReasonPhrases.INTERNAL_SERVER_ERROR, status = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

class PaymentErrorResponse extends ErrorResponse {
  constructor(message = ReasonPhrases.BAD_GATEWAY, status = StatusCodes.BAD_GATEWAY) {
    super(message, status);
  }
}

class PaymentCallbackError extends ErrorResponse {
  constructor(message = ReasonPhrases.BAD_GATEWAY, status = -1) {
    super(message, status);
  }
}

export {
  ConflictRequestError, //
  BadRequestError,
  AuthFailureError,
  NotFoundError,
  ForbiddenError,
  RedisErrorResponse,
  ServerErrorResponse,
  PaymentErrorResponse,
  PaymentCallbackError,
};
