"use strict";

const StatusCode = {
  OK: 200,
  CREATED: 201,
};

const ReasonStatusCode = {
  OK: "Created",
  CREATED: "Success",
};

class successResponse {
  constructor({ message, statusCode = StatusCode.OK, reasonStatusCode = ReasonStatusCode.OK, metadata = {}, success = true }) {
    this.message = !message ? reasonStatusCode : message;
    this.status = statusCode;
    this.metadata = metadata;
    this.success = success;
  }

  send(res, headers = {}) {
    return res.status(this.status).json(this);
  }
}

class OK extends successResponse {
  constructor({ message, metadata }) {
    super({ message, metadata });
  }
}

class CREATED extends successResponse {
  constructor({ message, statusCode = StatusCode.CREATED, reasonStatusCode = ReasonStatusCode.CREATED, metadata, options = {} }) {
    super({ message, statusCode, reasonStatusCode, metadata });
    this.options = options;
  }
}

export { OK, CREATED, successResponse };
