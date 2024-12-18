/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
require("dotenv").config();

module.exports = {
  development: {
    client: "pg", // Используем PostgreSQL
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 2222,
      database: process.env.DB_NAME || "postgres",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "changeme",
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations", // Папка для хранения миграций
    },
  },
};
