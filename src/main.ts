#!/usr/bin/env node

/**
 * Required environment variables:
 *   - PS_CLIENT_ID
 *   - PS_CLIENT_SECRET
 *
 * Optional environment variables:
 *   - LISTEN_PORT (defaults to 8080)
 *   - VERBOSE=1
 */

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as winston from 'winston';
import Client, {AuthenticationError, Env} from './promptside/Client';
import WebHookRoute from './routes/WebHookRoute';

const port = parseInt(process.env['LISTEN_PORT']) || 8080;

// Configure logging
let logLevel = 'info';
if ('VERBOSE' in process.env && parseInt(process.env['VERBOSE'])) {
    logLevel = 'debug';
}
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()],
    levels: winston.config.syslog.levels,
    level: logLevel,
});

// Set up client for the Promptside REST API
const apiAuthScope = 'core:sales self-service:sales';
const promptsideClient = new Client(
    process.env['PS_CLIENT_ID'],
    process.env['PS_CLIENT_SECRET'],
    apiAuthScope
);
promptsideClient.setLogger(logger);

// Set up web server
const server = express();
server.use(bodyParser.text({type: 'application/jwt'}));
server.use('/hook', new WebHookRoute(promptsideClient, logger).router);
server.on('error', (err: any) => {
    logger.error(err);
});

// Test our Promptside API credentials, then start listening for web hooks
promptsideClient.authenticate().then(() => {
    server.listen(port, () => {
        logger.info('Listening on port '+port);
    });
}).catch((err: AuthenticationError) => {
    logger.crit('Promptside API authentication failed (error type '+err.authenticationError+'): '+err.message);
    process.exit(1);
});
