import { mkdirSync } from "fs";
import { cache, save } from "./file";
import {
  discussionResolutionTime,
  discussionResponseTime,
  getCommits,
  getDefinitelyGenerated,
  getDiscussions,
  getForks,
  getIssues,
  getPossiblyGenerated,
  getPullRequests,
  getReleases,
  getStars,
  issueResolutionTime,
  issueResponseTime,
} from "./github";
import { binDatesCumulative, binDateRanges } from "./time";
import { avg, med } from "./util";

const raw = "./data/raw";
const output = "./data/output";

mkdirSync(raw, { recursive: true });
mkdirSync(output, { recursive: true });

/** load data from raw cache, or from github if doesn't exist */
const possiblyGenerated = await cache(
  getPossiblyGenerated,
  `${raw}/possibly-generated`
);
const generated = await cache(
  async () =>
    (
      await Promise.all(
        possiblyGenerated.map(async (repo) => {
          const owner = repo.owner?.login;
          const name = repo.name;
          if (!owner || !name) return;
          const date = await getDefinitelyGenerated(owner, name);
          if (!date) return;
          return { owner, repo: name, date: date.toISOString() };
        })
      )
    ).filter((repo) => !!repo),
  `${raw}/generated`
);
const stars = await cache(getStars, `${raw}/stars`);
const forks = await cache(getForks, `${raw}/forks`);
const commits = await cache(getCommits, `${raw}/commits`);
const pullRequests = await cache(getPullRequests, `${raw}/pull-requests`);
const issues = await cache(getIssues, `${raw}/issues`);
const discussions = await cache(getDiscussions, `${raw}/discussions`);
const releases = await cache(getReleases, `${raw}/releases`);

/** process generated data */
{
  const total = generated.length;
  const repos = generated;
  const overTime = binDatesCumulative(generated.map((repo) => repo.date));
  save({ total, repos, overTime }, `${output}/generated`);
}

/** process star data */
{
  const total = stars.length;
  const overTime = binDatesCumulative(stars.map((star) => star.starred_at));
  save({ total, overTime }, `${output}/stars`);
}

/** process fork data */
{
  const total = forks.length;
  const overTime = binDatesCumulative(forks.map((fork) => fork.created_at));
  save({ total, overTime }, `${output}/forks`);
}

/** process issue data */
{
  const total = issues.length;
  const overTime = binDateRanges(
    issues.map((issue) => [issue.created_at, issue.closed_at] as const)
  );
  const responseTimes = issues.map(issueResponseTime).filter((d) => d !== null);
  const resolutionTimes = issues
    .map(issueResolutionTime)
    .filter((d) => d !== null);
  save(
    {
      total,
      overTime,
      response: { avg: avg(responseTimes), med: med(responseTimes) },
      resolution: { avg: avg(resolutionTimes), med: med(resolutionTimes) },
    },
    `${output}/issues`
  );
}

/** process discussion data */
{
  const total = discussions.length;
  const overTime = binDateRanges(
    discussions.map(
      (discussion) => [discussion.createdAt, discussion.answerChosenAt] as const
    )
  );
  const responseTimes = discussions
    .map(discussionResponseTime)
    .filter((d) => d !== null);
  const resolutionTimes = discussions
    .map(discussionResolutionTime)
    .filter((d) => d !== null);
  save(
    {
      total,
      overTime,
      response: { avg: avg(responseTimes), med: med(responseTimes) },
      resolution: { avg: avg(resolutionTimes), med: med(resolutionTimes) },
    },
    `${output}/discussions`
  );
}

/** process commit data */
{
  const total = commits.length;
  const overTime = binDatesCumulative(
    commits.map((commit) => commit.commit.committer?.date)
  );
  save({ total, overTime }, `${output}/commits`);
}

/** process pull request data */
{
  const total = pullRequests.length;
  const overTime = binDatesCumulative(pullRequests.map((pr) => pr.created_at));
  save({ total, overTime }, `${output}/pull-requests`);
}

/** process release data */
{
  const list = releases.map((release) => ({
    name: release.name,
    date: release.created_at,
  }));
  const totalMinor = list.filter((release) =>
    release.name?.endsWith(".0")
  ).length;
  const totalPatch = list.filter(
    (release) => !release.name?.endsWith(".0")
  ).length;
  save({ totalMinor, totalPatch, list }, `${output}/releases`);
}
