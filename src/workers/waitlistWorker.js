const { Worker } = require('bullmq');
const config = require('../config');
const { JOB_QUEUE_NAME, JOBS } = require('../constants');
const { promoteFromWaitlist, recoverStuckEntries } = require('../services/waitlistService');
const { sendConfirmation } = require('../services/confirmationService');

const handlers = {
  [JOBS.PROMOTE_WAITLIST]: promoteFromWaitlist,
  [JOBS.SEND_CONFIRMATION]: sendConfirmation,
};

async function start() {
  const recovered = await recoverStuckEntries();
  if (recovered) console.log(`Recovered ${recovered} waitlist entries left in processing`);

  const worker = new Worker(
    JOB_QUEUE_NAME,
    async (job) => {
      const handler = handlers[job.name];
      if (!handler) throw new Error(`Unknown job type: ${job.name}`);
      return handler(job.data);
    },
    {
      connection: { host: config.redis.host, port: config.redis.port, maxRetriesPerRequest: null },
      concurrency: 1,
    }
  );

  worker.on('completed', (job, result) => console.log(`Job ${job.name} #${job.id} done`, result || ''));
  worker.on('failed', (job, err) => console.error(`Job ${job && job.name} failed:`, err.message));
  worker.on('error', (err) => console.error('Worker error:', err.message));

  const shutdown = async () => {
    await worker.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('MediBook worker started');
}

start().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});