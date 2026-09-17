[English](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.md) | [繁體中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-TW.md) | [简体中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-CN.md)

# dsh-git-style-zeta

为 DeepSeek Harness（DSH）提供可配置的 Git commit 与 PR 指引。插件通过
DSH 原生 system prompt 添加两个可选区段：`git-commit-instructions` 与
`git-pr-instructions`。

这些内容是 prompt 指引，并非强制机制，无法保证每笔 commit 都包含署名。
插件不执行 Git、不安装 hook、不更改 Git 配置、Codex／Claude 配置，也不
重写已有 commits。插件加入的 prompt 会要求保留已有作者与共同作者署名，
包括其他 agents 已添加的署名。

## 实际界面

![DSH 原生插件列表显示 dsh-git-style-zeta 已启用](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/plugin-list-zh.png)

插件已加载到 DSH 原生插件列表。

![DSH system prompt 显示已配置的 Git commit 指令](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/system-prompt-zh.png)

在 DSH 展开的 system prompt 中查看配置内容。

## 从 npm 安装

```sh
dsh plugin --profile web add dsh-git-style-zeta
# 重启 host
```

每个 profile 都是独立的安装根。请将 `web` 换成目标 profile，并在每个需要
这些指引的 profile 中单独安装。

## 配置

在 profile 的 `cordis.patch.yml` 中加入覆盖配置，通常位于
`$DSH_HOME/profiles/web/cordis.patch.yml`（`$DSH_HOME` 默认为 `~/.dsh`）。
bundle 已插入 `git-style-zeta` 这一行，因此用 `id` 覆盖，不要再次 `insert`：

```yaml
- id: git-style-zeta
  config:
    git-commit-instructions: |-
      使用 Conventional Commits，标题简洁并说明修改原因。
      仅在不存在时添加 Co-authored-by: Name <email>。
    git-pr-instructions: |-
      说明问题、修改后的行为，以及实际执行的检查。
      保留已有署名和模板中的隐藏标记。
```

| 配置项 | 默认值 | 用途 |
|---|---|---|
| `git-commit-instructions` | `""` | Commit 消息 |
| `git-pr-instructions` | `""` | PR 标题与描述 |

两项独立工作。省略、`null`、空字符串或仅含空白时，对应的 prompt 区段不会
加入。DSH 应用覆盖配置时会替换整行 `config`，两项都需要时请在覆盖配置中
同时保留。

插件会按原文加入你的配置，并要求模型保留已有作者与共同作者。请勿在
prompt 文本中放入凭证。只有加载此插件的 DSH host 与 profile 会受影响。

## 更新

明确指定版本安装，然后重启 host：

```sh
dsh plugin --profile web add dsh-git-style-zeta@0.1.0
```

## 移除

先从 profile 的 `cordis.patch.yml` 移除 `git-style-zeta` 覆盖配置，再执行：

```sh
dsh plugin --profile web remove dsh-git-style-zeta
# 重启 host
```

没有需要恢复的 Git hook 或 Git 配置，已有 commits 保持不变。

## 维护者

运行 `npm test` 可检查源代码。Release 自动化与 npm Trusted Publishing 配置
请参阅 [docs/releasing.md](docs/releasing.md)。

以 [MIT 许可证](LICENSE) 发布。
