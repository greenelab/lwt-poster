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
const stars = await cache(getStars, `${raw}/stars`);
const forks = await cache(getForks, `${raw}/forks`);
const commits = await cache(getCommits, `${raw}/commits`);
const pullRequests = await cache(getPullRequests, `${raw}/pull-requests`);
const issues = await cache(getIssues, `${raw}/issues`);
const discussions = await cache(getDiscussions, `${raw}/discussions`);
const releases = await cache(getReleases, `${raw}/releases`);
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

/** process star data */
save(
  { overTime: binDatesCumulative(stars.map((star) => star.starred_at)) },
  `${output}/stars`
);

/** process fork data */
save(
  { overTime: binDatesCumulative(forks.map((star) => star.created_at)) },
  `${output}/forks`
);

/** process issue data */
save(
  {
    total: issues.length,
    overTime: binDateRanges(
      issues.map((issue) => [issue.created_at, issue.closed_at] as const)
    ),
    response: (() => {
      /** get all times */
      const times = issues.map(issueResponseTime).filter((d) => d !== null);
      /** calc overview numbers */
      return { avg: avg(times), med: med(times) };
    })(),
    resolution: (() => {
      /** get all times */
      const times = issues.map(issueResolutionTime).filter((d) => d !== null);
      /** calc overview numbers */
      return { avg: avg(times), med: med(times) };
    })(),
  },
  `${output}/issues`
);

/** process discussion data */
save(
  {
    total: discussions.length,
    overTime: binDateRanges(
      discussions.map(
        (discussion) =>
          [discussion.createdAt, discussion.answerChosenAt] as const
      )
    ),
    response: (() => {
      /** get all times */
      const times = discussions
        .map(discussionResponseTime)
        .filter((d) => d !== null);
      /** calc overview numbers */
      return { avg: avg(times), med: med(times) };
    })(),
    resolution: (() => {
      /** get all times */
      const times = discussions
        .map(discussionResolutionTime)
        .filter((d) => d !== null);
      /** calc overview numbers */
      return { avg: avg(times), med: med(times) };
    })(),
  },
  `${output}/discussions`
);

/** process commit data */
save(
  {
    overTime: binDatesCumulative(
      commits.map((commit) => commit.commit.committer?.date)
    ),
  },
  `${output}/commits`
);

/** process pull request data */
save(
  { overTime: binDatesCumulative(pullRequests.map((pr) => pr.created_at)) },
  `${output}/pull-requests`
);

/** process release data */
save(
  releases.map((release) => ({ name: release.name, date: release.created_at })),
  `${output}/releases`
);

/** process generated data */
save(
  {
    repos: generated,
    overTime: binDatesCumulative(generated.map((repo) => repo.date)),
  },
  `${output}/generated`
);
