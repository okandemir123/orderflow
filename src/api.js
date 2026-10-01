const express = require('express');
const { orderQueue } = require('./queue');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/orders', async (req, res) => {
  const { product, quantity } = req.body;
  if (!product || !quantity) {
    return res.status(400).json({ error: 'product and quantity required' });
  }

  const job = await orderQueue.add('process-order', {
    product,
    quantity,
    receivedAt: new Date().toISOString(),
  });

  res.status(202).json({ jobId: job.id, status: 'queued' });
});

app.get('/orders/:id', async (req, res) => {
  const job = await orderQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'job not found' });
  }

  const state = await job.getState();
  res.json({
    jobId: job.id,
    status: state,
    attemptsMade: job.attemptsMade,
    result: job.returnvalue,
    failedReason: job.failedReason,
  });
});

const server = app.listen(3000, () => {
  console.log('API listening on port 3000');
});

process.on('SIGTERM', async () => {
  await server.close();
  await orderQueue.close();
  process.exit(0);
});
