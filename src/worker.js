const { Worker } = require('bullmq');
const { connection } = require('./queue');

const worker = new Worker(
  'orders',
  async (job) => {
    console.log(`Processing order ${job.id}: ${job.data.product} x${job.data.quantity} (attempt ${job.attemptsMade + 1})`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (job.data.product === 'fail-me') {
      throw new Error('Simulated processing failure');
    }

    const invoiceId = `INV-${job.id}-${Date.now()}`;
    console.log(`Order ${job.id} done -> invoice ${invoiceId}`);
    return { invoiceId };
  },
  { connection, concurrency: 5 }
);

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message} (attempt ${job.attemptsMade}/3)`);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

console.log('Worker started, waiting for jobs...');
