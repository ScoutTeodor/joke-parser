exports.up = function (knex) {
  return knex.schema.createTable("jokes", (table) => {
    table.integer("joke_id").primary(); // Уникальный идентификатор анекдота, первичный ключ
    table.text("content").notNullable(); // Текст анекдота
    table.integer("rating").defaultTo(0); // Рейтинг
    table.timestamps(true, true); // Поля created_at и updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("jokes");
};
