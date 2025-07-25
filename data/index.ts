import { cache, save } from "./file";
import {
  discussionResponseTime,
  getCommits,
  getDiscussions,
  getForks,
  getIssues,
  getPullRequests,
  getReleases,
  getStars,
  issueResponseTime,
} from "./github";
import { getOverTime, getOverTimeRanges } from "./time";
import { avg, med } from "./util";

const stars = await cache(getStars, "./raw/stars");
const forks = await cache(getForks, "./raw/forks");
const commits = await cache(getCommits, "./raw/commits");
const pullRequests = await cache(getPullRequests, "./raw/pull-requests");
const issues = await cache(getIssues, "./raw/issues");
const discussions = await cache(getDiscussions, "./raw/discussions");
const releases = await cache(getReleases, "./raw/releases");

save(
  { overTime: getOverTime(stars.map((star) => star.starred_at)) },
  "./output/stars"
);

save(
  { overTime: getOverTime(forks.map((star) => star.created_at)) },
  "./output/forks"
);

save(
  {
    total: issues.length,
    overTime: getOverTimeRanges(
      issues.map((issue) => [issue.created_at, issue.closed_at] as const)
    ),
    response: (() => {
      const times = issues.map(issueResponseTime).filter((d) => d !== null);
      return { avg: avg(times), med: med(times), times };
    })(),
  },
  "./output/issues"
);

save(
  {
    total: discussions.length,
    overTime: getOverTimeRanges(
      discussions.map(
        (discussion) =>
          [discussion.createdAt, discussion.answerChosenAt] as const
      )
    ),
    answer: (() => {
      const times = discussions
        .map(discussionResponseTime)
        .filter((d) => d !== null);
      return { avg: avg(times), med: med(times), times };
    })(),
  },
  "./output/discussions"
);

save(
  {
    overTime: getOverTime(
      commits.map((commit) => commit.commit.committer?.date)
    ),
  },
  "./output/commits"
);

save(
  { overTime: getOverTime(pullRequests.map((pr) => pr.created_at)) },
  "./output/pull-requests"
);

save(
  releases.map((release) => ({ name: release.name, date: release.created_at })),
  "./output/releases"
);
