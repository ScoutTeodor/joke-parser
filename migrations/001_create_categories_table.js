exports.up = function (knex) {
  return knex.schema.createTable("categories", (table) => {
    table.increments("id").primary(); // Первичный ключ
    table.string("category").unique().notNullable(); // Название категории, уникальное значение
    table.string("url").unique().notNullable().defaultTo(""); // URL категории
    table.timestamps(true, true); // Поля created_at и updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("categories");
};
