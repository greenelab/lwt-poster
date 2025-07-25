import { load } from "./util.js";

export const stars = await load("stars");
export const forks = await load("forks");
export const issues = await load("issues");
export const discussions = await load("discussions");
export const commits = await load("commits");
export const pullRequests = await load("pull-requests");
export const releases = await load("releases");
