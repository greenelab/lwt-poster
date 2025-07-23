import { Octokit } from "octokit";
import { throttling } from "@octokit/plugin-throttling";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import type { Discussion } from "@octokit/graphql-schema";

const { AUTH_GITHUB } = process.env;

const owner = "greenelab";
const repo = "lab-website-template";

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
        console.log("issue", issue.number);
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
          comments(first: 100) {
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
`;

export const getDiscussions = async () =>
  (
    await octokit.graphql.paginate<{
      repository: { discussions: { nodes: Discussion[] } };
    }>(discussionsQuery, { owner, repo })
  ).repository.discussions.nodes;
