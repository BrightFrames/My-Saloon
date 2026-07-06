import app from './app';
import { env } from './config/env';
import { ensureSalonsSchema } from './config/salonSchema';
import { initSocket } from './socket';

async function startServer() {
    try {
        await ensureSalonsSchema();
        console.log('[db]: PostgreSQL connected successfully!');
    } catch (err: any) {
        console.error('[db]: Failed to ensure salons schema:', err?.message || err);
        process.exit(1);
    }

    const server = app.listen(env.PORT, () => {
        console.log(`[server]: Server is running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Initialize Socket.IO with the HTTP server
    initSocket(server);

    return server;
}

const serverPromise = startServer();

// Handle Uncaught Exceptions (Synchronous programming errors)
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

// Graceful Shutdown for Unhandled Rejections (e.g. database disconnects prematurely)
process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
    console.error(err.name, err.message, err.stack);
    serverPromise.then((server) => {
        server.close(() => {
            process.exit(1);
        });
    });
});

// Signal termination handling (for Docker/K8s/PM2 process stops)
process.on('SIGTERM', () => {
    console.info('👋 SIGTERM received. Shutting down gracefully...');
    serverPromise.then((server) => {
        server.close(() => {
            console.log('💥 Process terminated!');
        });
    });
});
