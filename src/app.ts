import express from "express";
import {logger} from "./common/logger/logger.js";
import {routes} from "./routes";
import {correlationId} from "./common/correlation/correlationId";
import {errorHandler} from "./common/error/errorHandler";

// localhost:3000/api/
export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(correlationId);
    app.use('/api', routes)
    app.use(errorHandler);
    return app;
}
