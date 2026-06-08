import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const PROJECTS_KEY = "@project_planner:projects";

// In-memory fallback used when native AsyncStorage is unavailable (useful for
// development in Expo without rebuilding native modules).
let inMemoryProjects = null;

// Remote persistence for Expo Go demo devices (adjust IP to your dev machine)
const REMOTE_PROJECTS_URL = "http://192.168.0.9:3000/projects";
const REMOTE_TIMEOUT = 10000;

async function readProjects() {
  try {
    // Try native AsyncStorage first
    const storedProjects = await AsyncStorage.getItem(PROJECTS_KEY);
    if (!storedProjects) {
      return [];
    }

    try {
      const parsedProjects = JSON.parse(storedProjects);
      return Array.isArray(parsedProjects) ? parsedProjects : [];
    } catch (_error) {
      return [];
    }
  } catch (err) {
    // Native module missing: try remote backend persistence (useful for Expo Go)
    console.warn(
      "[projectStorage] AsyncStorage unavailable, trying remote persistence:",
      err?.message || err,
    );

    try {
      const resp = await axios.get(REMOTE_PROJECTS_URL, {
        timeout: REMOTE_TIMEOUT,
      });
      const projects = Array.isArray(resp.data?.projects)
        ? resp.data.projects
        : [];
      inMemoryProjects = projects;
      return projects;
    } catch (remoteErr) {
      console.warn(
        "[projectStorage] Remote projects fetch failed:",
        remoteErr?.message || remoteErr,
      );
      if (inMemoryProjects === null) inMemoryProjects = [];
      return inMemoryProjects;
    }
  }
}

async function writeProjects(projects) {
  try {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    // keep in-memory synced as well
    inMemoryProjects = projects;
    return;
  } catch (err) {
    console.warn(
      "[projectStorage] Failed to write AsyncStorage, falling back to remote/memory:",
      err?.message || err,
    );
  }

  // Try to persist to remote backend as a best-effort fallback
  try {
    // Sync by posting/putting each project
    for (const p of projects) {
      if (p.id) {
        await axios.put(`${REMOTE_PROJECTS_URL}/${p.id}`, p, {
          timeout: REMOTE_TIMEOUT,
        });
      } else {
        await axios.post(REMOTE_PROJECTS_URL, p, { timeout: REMOTE_TIMEOUT });
      }
    }
    inMemoryProjects = projects;
  } catch (remoteErr) {
    console.warn(
      "[projectStorage] Remote sync failed, keeping in-memory only:",
      remoteErr?.message || remoteErr,
    );
    inMemoryProjects = projects;
  }
}

export async function saveProject(project) {
  const projects = await readProjects();
  const nextProjects = [...projects, project];

  await writeProjects(nextProjects);

  // If native storage not available, ensure server has the new project
  if (inMemoryProjects !== null && inMemoryProjects === nextProjects) {
    try {
      await axios.post(REMOTE_PROJECTS_URL, project, {
        timeout: REMOTE_TIMEOUT,
      });
    } catch (_e) {
      // best-effort
    }
  }

  return project;
}

export async function getProjects() {
  return readProjects();
}

export async function updateProject(project) {
  const projects = await readProjects();
  const nextProjects = projects.map((storedProject) =>
    storedProject.id === project.id ? project : storedProject,
  );

  await writeProjects(nextProjects);

  try {
    await axios.put(`${REMOTE_PROJECTS_URL}/${project.id}`, project, {
      timeout: REMOTE_TIMEOUT,
    });
  } catch (_e) {
    // best-effort
  }

  return project;
}
