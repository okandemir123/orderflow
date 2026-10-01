const { Queue } = require('bullmq');

const connection = { host: 'localhost', port: 6379 };

const orderQueue = new Queue('orders', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

module.exports = { orderQueue, connection };
