exports.up = function (knex) {
  return knex.schema.createTable("jokes", (table) => {
    table.increments("id").primary(); // Первичный ключ
    table
      .integer("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("categories") // Внешний ключ на таблицу categories
      .onDelete("CASCADE");

    table.integer("rating").defaultTo(0); // Рейтинг
    table.string("joke_id").unique().notNullable(); // Уникальный идентификатор анекдота
    table.text("content").notNullable(); // Текст анекдота
    table.timestamps(true, true); // Поля created_at и updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("jokes");
};
