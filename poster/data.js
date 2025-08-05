/** load data file */
const load = async (name) =>
  await (await fetch(`../data/output/${name}.json`)).json();

/** import all data */
export const stars = await load("stars");
export const forks = await load("forks");
export const issues = await load("issues");
export const discussions = await load("discussions");
export const commits = await load("commits");
export const pullRequests = await load("pull-requests");
export const releases = await load("releases");

/** make data globally available */
window.data = {
  stars,
  forks,
  issues,
  discussions,
  commits,
  pullRequests,
  releases,
};

window.dispatchEvent(new CustomEvent("data"));
