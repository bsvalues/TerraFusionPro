const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "stardust-property.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Stardust Property server running at http://0.0.0.0:${port}`);
});
