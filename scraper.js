const axios = require("axios");
const cheerio = require("cheerio");
const knex = require("knex")(require("./knexfile").development);

const BASE_URL = "https://anekdoty.ru";

/**
 * scrapePage - парсит анекдоты с одной страницы.
 * @param {string} url - URL страницы для парсинга.
 * @returns {Array} jokes - Массив объектов с анекдотами.
 */
async function scrapePage(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const jokes = [];
    $("li[id]").each((_, element) => {
      const jokeId = $(element).attr("id");
      const content = $(element).find(".holder-body p").text().trim();
      const rating =
        parseInt($(element).find(".like-counter").text().trim(), 10) || 0;

      if (jokeId && content) {
        jokes.push({
          joke_id: jokeId,
          content,
          rating,
        });
      }
    });

    console.log(`Scraped ${jokes.length} jokes from ${url}.`);
    return jokes;
  } catch (error) {
    console.error(`Error scraping page ${url}:`, error.message);
    throw error;
  }
}

/**
 * scrapeCategory - парсит все страницы одной категории анекдотов.
 * @param {string} categoryUrl - URL категории анекдотов.
 * @param {number} categoryId - ID категории из базы данных.
 */
async function scrapeCategory(categoryUrl, categoryId) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1 ? categoryUrl : `${categoryUrl}${page}/`;
    console.log(`Scraping ${url}...`);

    try {
      const jokes = await scrapePage(url, categoryId);
      if (jokes.length > 0) {
        await saveJokes(jokes, categoryId);
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error scraping category page ${url}:`, error.message);
      hasMore = false;
    }
  }
}

/**
 * saveJokes - сохраняет анекдоты в базу данных.
 * @param {Array} jokes - Массив объектов с анекдотами.
 * @param {number} categoryId - ID категории из базы данных.
 */
async function saveJokes(jokes, categoryId) {
  try {
    await knex("jokes")
      .insert(
        jokes.map(({ joke_id, content, rating }) => ({
          joke_id,
          content,
          rating,
        }))
      )
      .onConflict("joke_id")
      .merge();

    const jokeCategories = jokes.map(({ joke_id }) => ({
      joke_id,
      category_id: categoryId,
    }));
    await knex("joke_categories")
      .insert(jokeCategories)
      .onConflict(["joke_id", "category_id"])
      .ignore();

    console.log(
      `Saved ${jokes.length} jokes and their category links to database.`
    );
  } catch (error) {
    console.error(
      "Error saving jokes or category links to database:",
      error.message
    );
  }
}

/**
 * scrapeCategories - собирает категории анекдотов с сайта.
 * @returns {Array} Массив объектов с категориями.
 */
async function scrapeCategories() {
  try {
    const { data } = await axios.get(BASE_URL);
    const $ = cheerio.load(data);

    const categories = [];
    $(".category-list a").each((_, element) => {
      const categoryPath = $(element).attr("href");
      const categoryName = $(element).text().trim();
      if (categoryPath && categoryName) {
        categories.push({
          url: new URL(categoryPath, BASE_URL).href,
          name: categoryName,
        });
      }
    });

    console.log(`Found ${categories.length} categories.`);
    return categories;
  } catch (error) {
    console.error("Error scraping categories:", error.message);
    throw error;
  }
}

/**
 * main - основной процесс парсинга.
 */
async function main() {
  try {
    const categories = await scrapeCategories();
    // Сохранение категорий в базу данных и получение их ID
    const categoriesWithIds = [];
    for (const category of categories) {
      try {
        const insertedCategory = await knex("categories")
          .insert({ category: category.name, url: category.url })
          .onConflict("category")
          .merge()
          .returning("id");

        const categoryId = Array.isArray(insertedCategory)
          ? insertedCategory[0]?.id || insertedCategory[0]
          : insertedCategory.id;

        if (categoryId) {
          categoriesWithIds.push({
            ...category,
            id: categoryId,
          });
        } else {
          console.warn(
            `Could not retrieve ID for category: ${category.name}. Skipping...`
          );
        }
      } catch (error) {
        console.error(
          `Error inserting category "${category.name}":`,
          error.message
        );
      }
    }

    // Парсинг анекдотов для каждой категории
    for (const category of categoriesWithIds) {
      if (category.id) {
        console.log(`Scraping jokes for category: ${category.name}`);
        await scrapeCategory(category.url, category.id);
      } else {
        console.warn(`Skipping category ${category.name} due to missing ID.`);
      }
    }
  } catch (error) {
    console.error("Error in main scraper:", error.message);
  } finally {
    knex.destroy();
  }
}

main();
