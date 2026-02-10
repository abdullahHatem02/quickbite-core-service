import express from "express";
import {logger} from "./common/logger/logger.js";
import {routes} from "./routes.ts";
import {correlationId} from "./common/correlation/correlationId.ts";
import {errorHandler} from "./common/error/errorHandler.ts";

// localhost:3000/api/
export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(correlationId);
    app.use('/api', routes)
    app.use(errorHandler);
    return app;
}
