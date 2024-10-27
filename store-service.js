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

module.exports.addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    if ((itemData = null)) {
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
