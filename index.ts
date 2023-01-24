import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';
import * as github from '@actions/github';

import { createNewStandardLint } from 'standardlint';

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || '';

const octokit = github.getOctokit(GITHUB_TOKEN);

/**
 * @description Orchestrates the action.
 */
async function run() {
  try {
    const config = getConfig(GITHUB_WORKSPACE, 'standardlint.json');
    const standardLint = createNewStandardLint(config);
    const results = standardLint.check();

    await createCheck(github.context.payload, results);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

/**
 * @description Get configuration from the expected file on disk.
 */
function getConfig(basePath: string, filePath: string) {
  try {
    const fullPath = path.join(basePath, filePath);
    const exists = fs.existsSync(fullPath);

    if (exists) return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return {};
  } catch (error) {
    console.error('Unable to read contents of file...', error);
    return {};
  }
}

/**
 * @description Produce and create the GitHub Check with annotations.
 */
async function createCheck(payload: Record<string, any>, result: Record<string, any>) {
  const [owner, repo] = GITHUB_REPOSITORY.split('/');

  const statuses = result.results.map((result: Record<string, any>) => result.status);
  const hasPassedAllTests = !statuses.some((status: string) => status === 'fail');

  const { passes, warnings, failures } = result;

  const time = new Date().toISOString();
  const sha =
    payload?.head_commit?.id ||
    payload?.event?.pull_request?.head?.sha ||
    payload?.sha ||
    'UNKNOWN';

  await octokit.rest.checks.create({
    owner,
    repo,
    name: 'StandardLint audit',
    head_sha: sha,
    started_at: time,
    completed_at: time,
    status: 'completed',
    conclusion: hasPassedAllTests ? 'success' : 'failure',
    output: {
      title: 'StandardLint audit',
      summary: `There are ${failures} failures, ${warnings} warnings, and ${passes} passing checks.`,
      text: 'The StandardLint audit has finished.',
      annotations: makeAnnotations(result.results)
    }
  });
}

/**
 * @description Make the annotations that will be shown in the Check.
 */
const makeAnnotations = (results: Record<string, any>[]) => {
  return results.map((result: Record<string, any>) => {
    const { name, message, status, path } = result;

    return {
      title: name,
      message,
      annotation_level: mapStatusToGitHubAnnotationLevel(status),
      path,
      start_line: 1,
      end_line: 1
    };
  });
};

/**
 * @description Map the StandardLint check status with the appropriate GitHub status name.
 */
const mapStatusToGitHubAnnotationLevel = (status: string) => {
  if (status === 'pass') return 'notice';
  if (status === 'warn') return 'warning';
  if (status === 'fail') return 'failure';
};

// Run the action
run();
