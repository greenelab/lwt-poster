import { Octokit } from "octokit";
import { throttling } from "@octokit/plugin-throttling";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import type { Discussion } from "@octokit/graphql-schema";
import { differenceInHours, min } from "date-fns";

const { AUTH_GITHUB } = process.env;

const owner = "greenelab";
const repo = "lab-website-template";
const maintainer = "vincerubinetti";

export const octokit = new (Octokit.plugin(throttling).plugin(paginateGraphQL))(
  {
    auth: AUTH_GITHUB,
    throttle: { onRateLimit: () => true, onSecondaryRateLimit: () => true },
  }
);

const per_page = 100;

export const getCommits = () =>
  octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    per_page,
  });

export const getStars = () =>
  octokit.paginate(octokit.rest.activity.listStargazersForRepo, {
    owner,
    repo,
    per_page,
    headers: { accept: "application/vnd.github.star+json" },
  });

export const getForks = () =>
  octokit.paginate(octokit.rest.repos.listForks, {
    owner,
    repo,
    per_page,
  });

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
        const comments = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: issue.number,
        });
        return { ...issue, comments: comments.data };
      })
  );

export const getPullRequests = () =>
  octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "all",
  });

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

export const getDiscussions = async () =>
  (
    await octokit.graphql.paginate<{
      repository: { discussions: { nodes: Discussion[] } };
    }>(discussionsQuery, { owner, repo })
  ).repository.discussions.nodes;

export const issueResponseTime = (
  issue: Awaited<ReturnType<typeof getIssues>>[number]
) => {
  if (issue.user?.login === maintainer) return null;
  const open = issue.created_at;

  const response = issue.comments.find(
    (comment) => comment.user?.login === maintainer
  )?.created_at;

  if (!response) return null;

  return differenceInHours(response, open, { roundingMethod: "ceil" });
};

export const discussionResponseTime = (
  discussion: Awaited<ReturnType<typeof getDiscussions>>[number]
) => {
  const open = discussion.createdAt;

  const comments: string[] = [];

  for (const comment of discussion.comments.edges ?? []) {
    if (comment?.node?.author?.login === maintainer)
      comments.push(comment?.node?.createdAt);

    for (const reply of comment?.node?.replies.edges ?? [])
      if (reply?.node?.author?.login === maintainer)
        comments.push(reply?.node?.createdAt);
  }

  const response = min(comments);

  return differenceInHours(response, open, { roundingMethod: "ceil" });
};
