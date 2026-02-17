import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TABLE users (
            id              SERIAL PRIMARY KEY,
            email           TEXT NOT NULL UNIQUE,
            phone           TEXT NOT NULL,
            name            TEXT NOT NULL,
            password_hash   TEXT NOT NULL,
            system_role     VARCHAR NOT NULL CHECK (system_role IN ('customer', 'restaurant_user', 'system_admin')),
            deleted_at      TIMESTAMPTZ NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX idx_users_email ON users (email);
        CREATE INDEX idx_users_system_role ON users (system_role);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE IF EXISTS users`);
}
