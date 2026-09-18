// apps/backend/src/index.ts
import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(` Predictive Maintenance API Server running on port ${env.PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Health check: http://localhost:${env.PORT}/health`);
  console.log(` API root: http://localhost:${env.PORT}/api`);
  console.log(`=======================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
