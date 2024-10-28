const fs = require("fs");
const path = require("path");

const items = [];
const categories = [];

module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, "/data/items.json"),
      "utf8",
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          items.push(...JSON.parse(data));
          fs.readFile(
            path.join(__dirname, "/data/categories.json"),
            "utf8",
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                categories.push(...JSON.parse(data));
                resolve();
              }
            }
          );
        }
      }
    );
  });
};

module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length > 0) {
      resolve(items);
    } else {
      reject("No Items available");
    }
  });
};

module.exports.getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    console.log("items:", items);

    const categoryItems = items.filter(
      (item) => item.category === parseInt(category)
    );
    console.log("Category Items:", categoryItems);
    if (categoryItems.length > 0) {
      resolve(categoryItems);
    } else {
      reject(`No Items available for ${category}`);
    }
  });
};

module.exports.getItemsByMinDate = (minDateStr) => {
  return new Promise((resolve, reject) => {
    const minDateItems = items.filter(
      (item) => new Date(item.postDate) >= new Date(minDateStr)
    );
    if (minDateItems.length > 0) {
      resolve(minDateItems);
    } else {
      reject(`No Items available from ${minDateStr}`);
    }
  });
};

module.exports.getItemById = (id) => {
  return new Promise((resolve, reject) => {
    const item = items.find((item) => item.id == id);
    if (item) {
      resolve(item);
    } else {
      reject(`No Items found with id ${id}`);
    }
  });
};

module.exports.addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    if (itemData != null) {
      itemData.published = undefined
        ? (itemData.published = false)
        : (itemData.published = true);
      itemData.id = items.length + 1;
      items.push(itemData);
      resolve(itemData);
    } else {
      reject("Item data is missing");
    }
  });
};

module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published === true);
    if (publishedItems.length > 0) {
      resolve(publishedItems);
    } else {
      reject("No Shop Items available");
    }
  });
};

module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length > 0) {
      resolve(categories);
    } else {
      reject("No Categories available");
    }
  });
};
