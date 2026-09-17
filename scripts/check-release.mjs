import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function assertVersion(value, label) {
  const match = typeof value === 'string' ? STRICT_SEMVER.exec(value) : null;
  if (!match) {
    throw new Error(`${label} must be a valid SemVer version, received ${JSON.stringify(value)}`);
  }
  return match;
}

export function assertReleaseTag(tag, packageVersion) {
  assertVersion(packageVersion, 'package.json version');

  if (typeof tag !== 'string' || !tag.startsWith('v')) {
    throw new Error(`release tag must start with "v", received ${JSON.stringify(tag)}`);
  }

  const tagVersion = tag.slice(1);
  assertVersion(tagVersion, 'release tag version');

  if (tagVersion !== packageVersion) {
    throw new Error(`release tag ${tag} does not match package.json version ${packageVersion}`);
  }

  return packageVersion;
}

export function npmDistTagForVersion(packageVersion) {
  const match = assertVersion(packageVersion, 'package.json version');
  return match[4] === undefined ? 'latest' : 'next';
}

export async function readPackageVersion(packagePath = resolve('package.json')) {
  let manifest;

  try {
    manifest = JSON.parse(await readFile(packagePath, 'utf8'));
  } catch (error) {
    throw new Error(`unable to read ${packagePath}: ${error.message}`, { cause: error });
  }

  assertVersion(manifest.version, 'package.json version');
  return manifest.version;
}

export async function checkRelease({
  tag = process.env.GITHUB_REF_NAME,
  packagePath = resolve('package.json'),
} = {}) {
  const packageVersion = await readPackageVersion(packagePath);
  assertReleaseTag(tag, packageVersion);
  return { tag, packageVersion };
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const distTagOnly = process.argv[2] === '--dist-tag';
  const tag = distTagOnly ? process.argv[3] : process.argv[2];

  checkRelease({ tag: tag ?? process.env.GITHUB_REF_NAME })
    .then(({ tag, packageVersion }) => {
      if (distTagOnly) {
        console.log(npmDistTagForVersion(packageVersion));
      } else {
        console.log(`release tag ${tag} matches package.json version ${packageVersion}`);
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
