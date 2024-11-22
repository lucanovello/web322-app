/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students. I acknowledge that violation
of this policy to any degree results in a ZERO for this assignment and possible failure of 
the course.

Name:                   Luca Novello
Student ID:             038515003
Date:                   11-21-2024
Vercel Web App URL:     https://web322app-lucanovello.vercel.app/
GitHub Repository URL:  https://github.com/lucanovello/web322-app
********************************************************************************/
const path = require("path");
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const storeService = require("./store-service.js");
require("dotenv").config();

cloudinary.config({
  cloud_name: "db7hupoyf",
  api_key: "525735259498182",
  api_secret: "i2Ey-eThtffKbqc2qVp47EyfU3U",
  secure: true,
});

const upload = multer();

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const hbs = exphbs.create({
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      const activeClass =
        url == app.locals.activeRoute
          ? "nav-menu-item active"
          : "nav-menu-item";
      return `<li class="${activeClass}">
                <a class="nav-menu-item-link" href="${url}">${options.fn(
        this
      )}</a>
              </li>`;
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (html) {
      return new Handlebars.SafeString(html);
    },
  },
});

app.use(express.static(path.join(__dirname, "public")));

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Routes //////////////////////////////////////////////////////////////
// Home route
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// About route
app.get("/about", (req, res) => {
  res.render("about");
});

// Shop route

app.get("/shop/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the item by "id"
    viewData.item = await storeService.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "item" by category
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// Items routes
app.get("/items", (req, res) => {
  const { category, minDate } = req.query;

  if (category) {
    storeService
      .getItemsByCategory(category)
      .then((items) => res.render("items", { items: items }))
      .catch((err) => {
        console.error(err);
        res.render("posts", { message: "Unable to fetch items by category" });
      });
  } else if (minDate) {
    storeService
      .getItemsByMinDate(minDate)
      .then((items) => res.render("items", { items: items }))
      .catch((err) => {
        console.error(err);
        res.render("posts", { message: "Unable to fetch items by date" });
      });
  } else {
    storeService
      .getAllItems()
      .then((items) => res.render("items", { items: items }))
      .catch((err) => {
        console.error(err);
        res.render("posts", { message: "Unable to fetch items by items" });
      });
  }
});

app.get("/items/add", (req, res) => {
  res.render("addItem");
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
  const processItem = (imageUrl) => {
    req.body.featureImage = imageUrl;

    storeService
      .addItem(req.body)
      .then(() => res.redirect("/items"))
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Unable to add item." });
      });
  };

  if (req.file) {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    streamUpload(req)
      .then((uploaded) => processItem(uploaded.url))
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Unable to upload image." });
      });
  } else {
    processItem("");
  }
});

app.get("/items/:id", (req, res) => {
  storeService
    .getItemById(req.params.id)
    .then((item) => res.json(item))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Unable to fetch item by ID." });
    });
});

// Categories routes
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((categories) => res.render("categories", { categories: categories }))
    .catch((err) => {
      console.error(err);
      res.render("categories", { message: "Unable to fetch categories." });
    });
});

// 404 route
app.use((req, res) => {
  res.render("404_page");
});

// Initialize the store service and start the server
storeService
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () =>
      console.log(`Server running at http://localhost:${HTTP_PORT}`)
    );
  })
  .catch((err) => {
    console.error("Failed to initialize store service:", err);
    process.exit(1);
  });
