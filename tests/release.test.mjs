import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assertReleaseTag,
  npmDistTagForVersion,
} from '../scripts/check-release.mjs';

test('accepts an exact stable release tag', () => {
  assert.equal(assertReleaseTag('v0.1.0', '0.1.0'), '0.1.0');
});

test('accepts an exact prerelease tag', () => {
  assert.equal(
    assertReleaseTag('v1.2.3-rc.1', '1.2.3-rc.1'),
    '1.2.3-rc.1',
  );
});

test('publishes stable versions on the latest dist-tag', () => {
  assert.equal(npmDistTagForVersion('1.2.3'), 'latest');
  assert.equal(npmDistTagForVersion('1.2.3+build.4'), 'latest');
  assert.equal(npmDistTagForVersion('1.2.3+build-4'), 'latest');
});

test('publishes prerelease versions on the next dist-tag', () => {
  assert.equal(npmDistTagForVersion('1.2.3-rc.1'), 'next');
  assert.equal(npmDistTagForVersion('1.2.3-beta.2+build.4'), 'next');
});

test('rejects a tag whose version differs from package.json', () => {
  assert.throws(
    () => assertReleaseTag('v0.2.0', '0.1.0'),
    /does not match package\.json version 0\.1\.0/,
  );
});

test('rejects a different prerelease identifier', () => {
  assert.throws(
    () => assertReleaseTag('v1.2.3-rc.2', '1.2.3-rc.1'),
    /does not match package\.json version 1\.2\.3-rc\.1/,
  );
});

test('rejects tags without the v prefix', () => {
  assert.throws(
    () => assertReleaseTag('0.1.0', '0.1.0'),
    /must start with "v"/,
  );
});

test('rejects malformed SemVer tags', () => {
  for (const tag of ['v1', 'v1.2', 'v01.2.3', 'v1.2.3-01', 'v1.2.3-']) {
    assert.throws(
      () => assertReleaseTag(tag, '1.2.3'),
      /release tag version must be a valid SemVer version/,
      tag,
    );
  }
});

test('rejects malformed package versions', () => {
  assert.throws(
    () => assertReleaseTag('v1.2.3', '1.2'),
    /package\.json version must be a valid SemVer version/,
  );
});
