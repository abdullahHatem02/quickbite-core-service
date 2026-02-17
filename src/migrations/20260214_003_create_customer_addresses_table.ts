import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TABLE customer_addresses (
            id              SERIAL PRIMARY KEY,
            user_id         BIGINT NOT NULL,
            label           TEXT NOT NULL,
            text            TEXT NOT NULL,
            lat             DECIMAL(10, 7) NOT NULL,
            lng             DECIMAL(10, 7) NOT NULL,
            is_default      BOOLEAN NOT NULL DEFAULT FALSE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT fk_customer_addresses_user_id FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE INDEX idx_customer_addresses_user_id ON customer_addresses (user_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE IF EXISTS customer_addresses`);
}
