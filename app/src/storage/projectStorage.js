import AsyncStorage from "@react-native-async-storage/async-storage";

const PROJECTS_KEY = "@project_planner:projects";

async function readProjects() {
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
}

async function writeProjects(projects) {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function saveProject(project) {
  const projects = await readProjects();
  const nextProjects = [...projects, project];

  await writeProjects(nextProjects);
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
  return project;
}
