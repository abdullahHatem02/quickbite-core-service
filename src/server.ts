import http from "http"
import {createApp} from './app.ts'
import { env } from './common/config/env.ts'
import {db} from './common/knex/knex.ts'
import {logger} from "./common/logger/logger.ts";

const app = createApp()
const server = http.createServer(app);

server.listen(env.port, ()=> {
    logger.info(`Server listening on ${env.port}`);
})

async function shutdown() {
    server.close(async()=> {
        console.log("Database shutdown");
        await db.destroy();
        process.exit(0);
    })
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);