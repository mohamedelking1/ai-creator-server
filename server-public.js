const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/ping", (req, res) => res.send("ok"));

app.get("/", (req, res) => {
  res.send("AI Creator Server Running 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port:", PORT);
});
