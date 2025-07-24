import { cache, save } from "./file";
import {
  getCommits,
  getDiscussions,
  getForks,
  getIssues,
  getPullRequests,
  getStars,
} from "./github";
import { getOverTime, getOverTimeRanges } from "./time";

const stars = await cache(getStars, "./raw/stars");
const forks = await cache(getForks, "./raw/forks");
const commits = await cache(getCommits, "./raw/commits");
const pullRequests = await cache(getPullRequests, "./raw/pull-requests");
const issues = await cache(getIssues, "./raw/issues");
const discussions = await cache(getDiscussions, "./raw/discussions");

save(
  getOverTime(stars.map((star) => star.starred_at)),
  "./output/stars-over-time"
);

save(
  getOverTime(forks.map((star) => star.created_at)),
  "./output/forks-over-time"
);

save(
  getOverTime(commits.map((commit) => commit.commit.committer?.date)),
  "./output/commits-over-time"
);

save(
  getOverTime(pullRequests.map((pr) => pr.created_at)),
  "./output/pull-requests-over-time"
);

save(
  getOverTimeRanges(
    issues.map((issue) => [issue.created_at, issue.closed_at] as const)
  ),
  "./output/issues-over-time"
);

save(
  getOverTimeRanges(
    discussions.map(
      (discussion) => [discussion.createdAt, discussion.answerChosenAt] as const
    )
  ),
  "./output/discussions-over-time"
);

save({ total: issues.length }, "./output/issues-total");
save({ total: discussions.length }, "./output/discussions-total");
