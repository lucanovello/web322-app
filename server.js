const path = require("path");
const express = require("express");
const storeService = require("./store-service.js");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

let currentUrl = "";

app.use(express.static("public"));

// ROUTES
app.get("/", (req, res) => {
  currentUrl = req.url;
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  currentUrl = req.url;
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get("/shop", (req, res) => {
  currentUrl = req.url;
  storeService
    .getPublishedItems()
    .then((pubItems) => res.send(pubItems))
    .catch((err) => res.send(err));
});

app.get("/items", (req, res) => {
  currentUrl = req.url;
  storeService
    .getAllItems()
    .then((items) => res.send(items))
    .catch((err) => res.send(err));
});

app.get("/categories", (req, res) => {
  currentUrl = req.url;
  storeService
    .getCategories()
    .then((categories) => res.send(categories))
    .catch((err) => res.send(err));
});

app.use((req, res) => {
  currentUrl = req.url;
  res.status(404).sendFile(__dirname + "/views/404_page.html");
});

// Initialize the store service
storeService
  .initialize()
  .then(() => {
    //Listen on port 8080
    app.listen(HTTP_PORT, () =>
      console.log(
        `"Express http server listening on port: \u001b[1;3;4;92mhttp://localhost:${HTTP_PORT}\u001b[0m`
      )
    );
  })
  .catch((err) => {
    console.error("ERROR: Initialization Failed:", err);
    process.exit(1);
  });

console.log(currentUrl);
