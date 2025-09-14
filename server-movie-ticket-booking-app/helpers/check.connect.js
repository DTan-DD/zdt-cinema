"use strict";

import mongoose from "mongoose";
import os from "os";
import process from "process";
const _SECOND = 5000;

// count connect
const countConnect = () => {
  const numConnect = mongoose.connections.length;
  console.log(`Number of connection: ${numConnect} `);
};

// check over load
const checkOverload = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    // example maximum number of connections based on number of cores
    const maxConnections = numCores * 5;
    console.log(`Active connections: ${numConnection} `);
    console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`);

    if (numConnection > maxConnections) {
      console.log(`Connection overload detected!`);
      //   notify.send(....)
    }
  }, _SECOND); // Monitor every 5 second
};

export { countConnect, checkOverload };
