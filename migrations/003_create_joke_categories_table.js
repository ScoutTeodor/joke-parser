exports.up = function (knex) {
  return knex.schema.createTable("joke_categories", (table) => {
    table
      .integer("joke_id")
      .notNullable()
      .references("joke_id")
      .inTable("jokes")
      .onDelete("CASCADE"); // Внешний ключ на таблицу jokes
    table
      .integer("category_id")
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("CASCADE"); // Внешний ключ на таблицу categories
    table.primary(["joke_id", "category_id"]); // Составной первичный ключ
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("joke_categories");
};
