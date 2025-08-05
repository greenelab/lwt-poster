import { Octokit } from "octokit";
import { throttling } from "@octokit/plugin-throttling";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import type { Discussion as DiscussionNode } from "@octokit/graphql-schema";
import { differenceInHours, min } from "date-fns";
import { today } from "./time";

/** github authentication token */
const { AUTH_GITHUB } = process.env;

if (!AUTH_GITHUB)
  console.warn("No GitHub auth. Requests might take longer or fail.");

/** org/repo/users we're dealing with */
const owner = "greenelab";
const repo = "lab-website-template";
const maintainer = "vincerubinetti";

/** github client */
export const octokit = new (Octokit.plugin(throttling).plugin(paginateGraphQL))(
  {
    auth: AUTH_GITHUB,
    throttle: { onRateLimit: () => true, onSecondaryRateLimit: () => true },
  }
);

/** max page limit */
const per_page = 100;

/** get all commits in repo */
export const getCommits = () =>
  octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    per_page,
  });

/** get all stars on repo */
export const getStars = () =>
  octokit.paginate(octokit.rest.activity.listStargazersForRepo, {
    owner,
    repo,
    per_page,
    headers: { accept: "application/vnd.github.star+json" },
  });

/** get all forks of rep  */
export const getForks = () =>
  octokit.paginate(octokit.rest.repos.listForks, {
    owner,
    repo,
    per_page,
  });

/** get all issues (w/ comments) in repo */
export const getIssues = async () =>
  await Promise.all(
    (
      await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner,
        repo,
        state: "all",
      })
    )
      .filter((issue) => !issue.pull_request)
      .map(async (issue) => {
        /** get all comments on issue */
        const comments = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: issue.number,
        });
        return { ...issue, comments: comments.data };
      })
  );

/** get all pull requests oin repo */
export const getPullRequests = () =>
  octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "all",
  });

/** graph ql query to get discussion info */
const discussionsQuery = `
  query paginate($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          title
          url
          author {
            login
          }
          createdAt
          answerChosenAt
          comments(first: 50) {
            edges {
              node {
                createdAt
                author {
                  login
                }
                replies(first: 50) {
                  edges {
                    node {
                      createdAt
                      author {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** get discussions (w/ replies) on repo */
export const getDiscussions = async () =>
  (
    await octokit.graphql.paginate<{
      repository: { discussions: { nodes: DiscussionNode[] } };
    }>(discussionsQuery, { owner, repo })
  ).repository.discussions.nodes;

type Issue = Awaited<ReturnType<typeof getIssues>>[number];
type Discussion = Awaited<ReturnType<typeof getDiscussions>>[number];

/** how much time it took to respond to issue */
export const issueResponseTime = (issue: Issue) => {
  /**
   * if issue was created by maintainer, ignore, because we are trying to measure
   * how well we respond to users
   */
  if (issue.user?.login === maintainer) return null;

  /** when issue was created */
  const open = issue.created_at;

  /** find time of first comment by maintainer */
  const response = issue.comments.find(
    (comment) => comment.user?.login === maintainer
  )?.created_at;

  /** if no response */
  if (!response) {
    console.warn(`Issue ${issue.number} has no maintainer comment`);
    return null;
  }

  /** subtract time */
  return differenceInHours(response, open, { roundingMethod: "ceil" });
};

/** how much time it took to respond to discussion */
export const discussionResponseTime = (discussion: Discussion) => {
  /**
   * if issue was created by maintainer, ignore, because we are trying to measure
   * how well we respond to users
   */
  if (discussion.author?.login === maintainer) return null;

  /** when discussion was created */
  const open = discussion.createdAt;

  const comments: string[] = [];

  /** find all nested comments/replies by maintainer */
  for (const comment of discussion.comments.edges ?? []) {
    if (comment?.node?.author?.login === maintainer)
      comments.push(comment?.node?.createdAt);
    for (const reply of comment?.node?.replies.edges ?? [])
      if (reply?.node?.author?.login === maintainer)
        comments.push(reply?.node?.createdAt);
  }

  /** if no response */
  if (!comments.length) {
    console.warn(`Discussion ${discussion.number} has no maintainer comment`);
    return null;
  }

  /** find earliest response by maintainer */
  const response = min(comments);

  /** subtract time */
  return differenceInHours(response, open, { roundingMethod: "ceil" });
};

/** how much time it took to resolve issue */
export const issueResolutionTime = (issue: Issue) => {
  const open = issue.created_at;
  const closed = issue.closed_at || today;
  /** subtract time */
  return differenceInHours(closed, open, { roundingMethod: "ceil" });
};

/** how much time it took to resolve discussion */
export const discussionResolutionTime = (discussion: Discussion) => {
  const open = discussion.createdAt;
  const closed = discussion.answerChosenAt || today;
  /** subtract time */
  return differenceInHours(closed, open, { roundingMethod: "ceil" });
};

/** get release timeline */
export const getReleases = () =>
  octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page,
  });
