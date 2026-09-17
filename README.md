[English](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.md) | [繁體中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-TW.md) | [简体中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-CN.md)

# dsh-git-style-zeta

Configurable Git commit and pull request guidance for DeepSeek Harness (DSH).
The plugin contributes two optional sections through DSH's native system prompt:
`git-commit-instructions` and `git-pr-instructions`.

This is prompt guidance, not enforcement. It cannot guarantee that every commit
contains attribution. It does not run Git, install hooks, change Git settings,
modify Codex or Claude, or rewrite existing commits. Its prompt preserves
existing authors and co-author attribution, including attribution from other
agents.

## Screenshots

![DSH plugin list showing dsh-git-style-zeta enabled](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/plugin-list-en.png)

The plugin loaded in DSH's native plugin list.

![DSH system prompt showing the configured Git commit instructions](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/system-prompt-en.png)

Configured instructions in DSH's expanded system prompt.

## Install from npm

```sh
dsh plugin --profile web add dsh-git-style-zeta
# restart the host
```

Profiles are separate install roots. Replace `web` with the target profile and
install the plugin into each profile that should use these instructions.

## Configure

Add an override to the profile's `cordis.patch.yml`, normally
`$DSH_HOME/profiles/web/cordis.patch.yml` (`$DSH_HOME` defaults to `~/.dsh`).
The bundle already inserts the `git-style-zeta` row, so configure it with `id`
rather than another `insert` entry:

```yaml
- id: git-style-zeta
  config:
    git-commit-instructions: |-
      Use Conventional Commits with a concise subject and explain why.
      Add Co-authored-by: Name <email> only when it is absent.
    git-pr-instructions: |-
      Describe the problem, resulting behavior, and checks actually run.
      Preserve existing attribution and hidden template markers.
```

| Field | Default | Used for |
|---|---|---|
| `git-commit-instructions` | `""` | Commit messages |
| `git-pr-instructions` | `""` | Pull request titles and descriptions |

The fields work independently. An omitted, `null`, empty, or whitespace-only
field disables its prompt section. DSH replaces the row's entire `config` when
applying an override, so keep both fields in the override when you use both.

The plugin adds your text as written and always asks the model to preserve
existing authors and co-authors. Do not put credentials in prompt text. Only
the DSH host and profile loading this plugin are affected.

## Update

Install the version explicitly, then restart the host:

```sh
dsh plugin --profile web add dsh-git-style-zeta@0.1.0
```

## Remove

Remove the `git-style-zeta` override from the profile's `cordis.patch.yml`, then:

```sh
dsh plugin --profile web remove dsh-git-style-zeta
# restart the host
```

There are no Git hooks or Git settings to restore. Existing commits remain
unchanged.

## Maintainers

Run `npm test` for the source tests. Release automation and npm Trusted
Publishing setup are documented in [docs/releasing.md](docs/releasing.md).

Released under the [MIT License](LICENSE).
