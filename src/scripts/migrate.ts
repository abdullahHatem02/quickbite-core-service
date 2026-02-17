import { db } from "../common/knex/knex.ts";

const command = process.argv[2];

async function run() {
    switch (command) {
        case "latest": {
            const [batch, migrations] = await db.migrate.latest();
            console.log(`Batch ${batch}: ${migrations.length} migrations run`);
            migrations.forEach((m: string) => console.log(`  ✓ ${m}`));
            break;
        }
        case "rollback": {
            const [batch, migrations] = await db.migrate.rollback();
            console.log(`Batch ${batch}: ${migrations.length} migrations rolled back`);
            migrations.forEach((m: string) => console.log(`  ✗ ${m}`));
            break;
        }
        case "status": {
            const [completed, pending] = await db.migrate.list();
            console.log("Completed:", completed.length ? completed.map((m: { name: string }) => m.name) : "none");
            console.log("Pending:", pending.length ? pending.map((m: { file: string }) => m.file) : "none");
            break;
        }
        default:
            console.log("Usage: tsx src/scripts/migrate.ts <latest|rollback|status>");
    }

    await db.destroy();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
