# Releases

Releases follow [dsh-notify-zeta](https://github.com/zeta987/dsh-notify-zeta) and [dsh-roles-zeta](https://github.com/zeta987/dsh-roles-zeta): push a version tag, pass checks, publish npm, then create a GitHub Release with generated notes, three README links, and the package tarball.

## One-time npm setup

npm Trusted Publishing requires an existing package. For a new package, publish a separate `0.0.0-bootstrap.0` version under the `bootstrap` dist-tag using the owner's authenticated npm CLI. Build it from a temporary copy of the checked package so the source version remains unchanged. Do not publish the intended stable version manually if its tag will use the automated workflow.

Then open the [npm package settings](https://www.npmjs.com/package/dsh-git-style-zeta/access) and configure:

| Setting | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `zeta987` |
| Repository | `dsh-git-style-zeta` |
| Workflow filename | `publish.yml` |
| Environment | Leave empty |
| Allowed actions | Allow direct `npm publish` |

The filename is `publish.yml`, not its directory path. No npm token secret is needed. The workflow uses GitHub-hosted Ubuntu, Node 24 and an OIDC-capable npm CLI. See [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

首次建立 npm 套件後，在套件設定填入上表的 GitHub 資訊，並允許直接發布；不需要提供 token。首次创建 npm 包后，在包设置填写上表的 GitHub 信息，并允许直接发布；无需提供 token。

## Publish a version

1. Update `package.json` and `package-lock.json` together with `npm version <version> --no-git-tag-version`.
2. Run `npm ci --ignore-scripts`, `npm run check`, and `npm run test:coverage`.
3. Review and commit the release using the existing Git signing configuration, then push the commit.
4. Create and push its matching signed tag, for example:

```sh
git tag -s v0.1.0 -m "dsh-git-style-zeta 0.1.0"
git push origin v0.1.0
```

GitHub Actions `publish.yml` checks that the tag exactly matches the package version before running checks and publishing. Stable versions use npm `latest`; prereleases use `next`. GitHub Releases use the same prerelease status. The workflow does not create tags.

The GitHub Release job runs only after npm succeeds. It adds installation instructions, README links, generated change notes, and a tarball from the same tag checkout. If only the Release job fails, rerun that job; it reuses an existing Release and replaces the attachment. Do not rerun a successful npm publication or reuse a published version with changed contents.

## Verification

- CI covers Ubuntu and Windows with Node 22.19.0 and Node 24.
- Runtime tests use real Cordis and DSH prompt services without external model calls.
- Package checks validate the shipped file list, including README images.
- Coverage thresholds apply to `lib/*.js`.
- Verify the Actions run, npm version/dist-tag/provenance, and GitHub Release after publication.

Keep repository topics `dsh-plugin`, `deepseek-harness`, and `dsh`. They are separate from npm keywords.
