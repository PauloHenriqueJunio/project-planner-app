const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();

const STORAGE_DIR = path.resolve(__dirname, "..", "storage");
const PROJECTS_FILE = path.join(STORAGE_DIR, "projects.json");

async function ensureStorage() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    try {
      await fs.access(PROJECTS_FILE);
    } catch (_) {
      await fs.writeFile(PROJECTS_FILE, JSON.stringify([]), "utf8");
    }
  } catch (err) {
    console.error("[projects] failed to ensure storage:", err);
    throw err;
  }
}

async function readProjectsFile() {
  await ensureStorage();
  const raw = await fs.readFile(PROJECTS_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

async function writeProjectsFile(projects) {
  await ensureStorage();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
}

router.get("/", async (_req, res) => {
  try {
    const projects = await readProjectsFile();
    res.json({ projects });
  } catch (err) {
    console.error("[projects] GET error", err);
    res.status(500).json({ error: "failed to read projects" });
  }
});

router.post("/", async (req, res) => {
  const project = req.body;
  if (!project) return res.status(400).json({ error: "missing project body" });

  try {
    const projects = await readProjectsFile();
    // ensure id
    if (!project.id) project.id = Date.now().toString();
    projects.push(project);
    await writeProjectsFile(projects);
    res.status(201).json({ project });
  } catch (err) {
    console.error("[projects] POST error", err);
    res.status(500).json({ error: "failed to save project" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  if (!updated) return res.status(400).json({ error: "missing body" });

  try {
    const projects = await readProjectsFile();
    const next = projects.map((p) => (p.id === id ? { ...p, ...updated } : p));
    await writeProjectsFile(next);
    res.json({ project: updated });
  } catch (err) {
    console.error("[projects] PUT error", err);
    res.status(500).json({ error: "failed to update project" });
  }
});

module.exports = router;
