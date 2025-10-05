"use strict";

/**
 * error: nghiem trong, anh huong den hoat dong cua code
 * warning:
 * debug
 * info:
 * requestId (traceId)
 */

import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import { uuidv7 } from "uuidv7";

class MyLogger {
  constructor() {
    const formatPrint = format.printf(({ level, message, context, requestId, timestamp, metadata }) => {
      return `${timestamp}::${level}::${context}::${requestId}::${message}::${JSON.stringify(metadata)} `;
    });

    this.logger = createLogger({
      format: format.combine(
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        formatPrint
      ),
      transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
          dirname: "src/logs",
          filename: "application-%DATE%.info.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "3d",
          level: "info",
        }),
        new transports.DailyRotateFile({
          dirname: "src/logs",
          filename: "application-%DATE%.error.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "3d",
          level: "error",
        }),
      ],
    });
  }

  commonParams(params) {
    let context, req, metadata;
    if (!Array.isArray(params)) {
      context = params;
    } else {
      [context, req, metadata] = params;
    }

    const requestId = req?.requestId || uuidv7();
    return {
      requestId,
      context,
      metadata,
    };
  }

  log(message, params) {
    const paramLog = this.commonParams(params);
    const logObject = Object.assign({ message }, paramLog);
    this.logger.info(logObject);
  }

  error(message, params) {
    const paramLog = this.commonParams(params);
    const logObject = Object.assign({ message }, paramLog);
    this.logger.error(logObject);
  }
}

export default new MyLogger();
