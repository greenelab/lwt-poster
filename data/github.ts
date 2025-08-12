import { Octokit, type RequestError } from "octokit";
import { throttling } from "@octokit/plugin-throttling";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import type { Discussion as DiscussionNode } from "@octokit/graphql-schema";
import { differenceInHours, min } from "date-fns";
import { today } from "./time";

/** github authentication token */
const { AUTH_GITHUB } = process.env;

/** org/repo/users we're dealing with */
const owner = "greenelab";
const repo = "lab-website-template";
const maintainer = "vincerubinetti";

/** searches */
const readmeSearch = `"lab website template" in:readme OR "lab-website-template" in:readme OR "greene lab" in:readme OR "greenelab" in:readme`;
const citationPath = "CITATION.cff";
const codeSearch = `"lab website template" path:${citationPath}`;
/** files + contents that indicate repo is definitely template */
const definiteSearches = [
  { path: citationPath, match: /greenelab\/lab-website-template/i },
  { path: "auto-cite/auto-cite.py", match: /manubot/i },
  { path: "_cite/cite.py", match: /manubot/i },
];

/** github client */
export const octokit = new (Octokit.plugin(throttling).plugin(paginateGraphQL))(
  {
    auth: AUTH_GITHUB,
    throttle: {
      onRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds.`
        );
        return true;
      },
      onSecondaryRateLimit: (_, options, octokit) => {
        octokit.log.warn(
          `SecondaryRateLimit detected for request ${options.method} ${options.url}`
        );
        return true;
      },
    },
  }
);

/** check if authenticated */
try {
  await octokit.rest.users.getAuthenticated();
} catch (error) {
  console.warn("No GitHub auth. Requests might take longer or fail.");
}

/** increase page size */
octokit.request = octokit.request.defaults({ per_page: 100 });

/** get all commits in repo */
export const getCommits = () =>
  octokit.paginate(octokit.rest.repos.listCommits, { owner, repo });

/** get all stars on repo */
export const getStars = () =>
  octokit.paginate(octokit.rest.activity.listStargazersForRepo, {
    owner,
    repo,
    /** https://docs.github.com/en/rest/activity/starring?apiVersion=2022-11-28#list-stargazers */
    headers: { accept: "application/vnd.github.star+json" },
  });

/** get all forks of rep  */
export const getForks = () =>
  octokit.paginate(octokit.rest.repos.listForks, { owner, repo });

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
  octokit.paginate(octokit.rest.pulls.list, { owner, repo, state: "all" });

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
  octokit.paginate(octokit.rest.repos.listReleases, { owner, repo });

/** search for repos that may have been generated from template */
export const getPossiblyGenerated = async () => {
  const repos = [
    await octokit.paginate(octokit.rest.search.repos, { q: readmeSearch }),
  ].flat();
  const code = [
    await octokit.paginate(octokit.rest.search.code, { q: codeSearch }),
  ].flat();
  return [...repos, ...code].filter((repo) => "owner" in repo);
};

/** get contents of file in repo */
export const getFile = async (owner: string, repo: string, path: string) => {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      mediaType: { format: "raw" },
    });
    return typeof data === "string" ? data : "";
  } catch (error) {
    /** https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content--status-codes */
    const status = (error as RequestError).status;
    if (status === 302) return "";
    if (status === 404) return "";
    throw error;
  }
};

/** get date file first added to repo */
export const getFileAdded = async (owner: string, repo: string, path: string) =>
  (
    await octokit.paginate(octokit.rest.repos.listCommits, {
      owner,
      repo,
      path,
    })
  )
    .map((commit) => {
      const date = commit.commit.committer?.date;
      return date ? new Date(date) : new Date();
    })
    // @ts-expect-error
    .sort((a, b) => a - b)
    .at(0);

/** check if repo is fork */
export const isFork = async (owner: string, repo: string) =>
  (await octokit.rest.repos.get({ owner, repo })).data.fork;

/** verify that repo was definitely generated from template */
export const getDefinitelyGenerated = async (owner: string, repo: string) => {
  /** don't re-count forks */
  if (await isFork(owner, repo)) return;

  /** find creation date of first matching file + contents */
  for (const { path, match } of definiteSearches)
    if ((await getFile(owner, repo, path)).match(match))
      return await getFileAdded(owner, repo, path);
};
