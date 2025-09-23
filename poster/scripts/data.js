/** load data file */
const load = async (name) =>
  await (await fetch(`../data/output/${name}.json`)).json();

/** import all data */
window.data = {
  generated: await load("generated"),
  stars: await load("stars"),
  forks: await load("forks"),
  issues: await load("issues"),
  discussions: await load("discussions"),
  commits: await load("commits"),
  pullRequests: await load("pull-requests"),
  releases: await load("releases"),
};

window.dispatchEvent(new CustomEvent("data"));
