const express = require("express");
const cors = require("cors");

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(express.static("public"));

// --- basics
app.use(express.json({ limit: "2mb" }));

// --- CORS (مهم للـ Admin Panel)
app.use(
  cors({
    origin: "*", // لاحقاً نخليها دومين الواجهة بس
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- health check (للتأكد إن الخدمة شغالة)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ai-creator-server", time: new Date().toISOString() });
});

// --- existing checks
app.get("/ping", (req, res) => res.send("ok"));

app.get("/", (req, res) => {
  res.send("AI Creator Server Running 🚀");
});

// --- AI Image Generation
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageUrl = result?.data?.[0]?.url;
    if (!imageUrl) {
      return res.status(500).json({ error: "No image returned" });
    }

    return res.json({ ok: true, imageUrl });
  } catch (err) {
    console.error("generate-image error:", err?.response?.data || err);
    return res.status(500).json({
      ok: false,
      error: err?.response?.data || err?.message || String(err),
    });
  }
});

// --- 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// --- error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- Render PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port:", PORT);
});
