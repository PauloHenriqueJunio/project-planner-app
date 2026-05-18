require("dotenv").config();

const express = require("express");
const cors = require("cors");

const scrapeRoute = require("./routes/scrape");
const healthRoute = require("./routes/health");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/scrape", scrapeRoute);
app.use("/health", healthRoute);

app.get("/", (_request, response) => {
  response.json({ status: "ok", service: "project-planner-scraper" });
});

app.listen(PORT, () => {
  console.log(`Project Planner scraper running on port ${PORT}`);
});

module.exports = app;
