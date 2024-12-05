require("dotenv").config();
const Sequelize = require("sequelize");

var sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    dialectModule: require("pg"),
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

// define the Item model
const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

// define the Category model
const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

// define the relationship between the Item and Category models
Item.belongsTo(Category, { foreignKey: "category" });

//Module Exports
module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve(
          "Connection to the database has been established successfully."
        );
      })
      .catch((error) => {
        console.log(`Connection failed!`);
        reject(error);
      });
  });
};

module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((data) => resolve(data))
      .catch(() => reject("No items found"));
  });
};

module.exports.getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category } })
      .then((data) => resolve(data))
      .catch(() => reject(`No items found in the ${category} category`));
  });
};

module.exports.getItemsByMinDate = (minDateStr) => {
  const { gte } = Sequelize.Op;
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { postDate: { [gte]: new Date(minDateStr) } } })
      .then((data) => resolve(data))
      .catch(() => reject(`No items found from ${minDateStr}`));
  });
};

module.exports.getItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { id } })
      .then((data) => resolve(data[0]))
      .catch(() => reject(`No item found for ID ${id}`));
  });
};

module.exports.addItem = (itemData) => {
  itemData.published = !!itemData.published;
  Object.keys(itemData).forEach((key) => {
    if (itemData[key] === "") itemData[key] = null;
  });
  itemData.postDate = new Date();
  return new Promise((resolve, reject) => {
    Item.create(itemData)
      .then(() => resolve())
      .catch(() => reject("Unable to add item"));
  });
};

module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true } })
      .then((data) => resolve(data))
      .catch(() => reject("No published items found"));
  });
};

module.exports.getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true, category } })
      .then((data) => resolve(data))
      .catch(() =>
        reject(`No published items found in the ${category} category`)
      );
  });
};

module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => resolve(data))
      .catch(() => reject("No categories found"));
  });
};

module.exports.addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    Category.create(categoryData)
      .then(() => resolve())
      .catch(() => reject("Unable to add category"));
  });
};

module.exports.deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    Category.destroy({ where: { id } })
      .then(() => resolve())
      .catch(() => reject("Unable to remove category"));
  });
};

module.exports.deleteItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.destroy({ where: { id } })
      .then(() => resolve())
      .catch(() => reject("Unable to remove item"));
  });
};
