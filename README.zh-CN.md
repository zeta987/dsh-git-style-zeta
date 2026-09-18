[English](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.md) | [繁體中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-TW.md) | [简体中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-CN.md)

# dsh-git-style-zeta

为 DeepSeek Harness（DSH）提供可配置的 Git commit 与 pull request 指引。
插件在 DSH 原生 system prompt 中加入两个可选区段，并在设置页里有自己的
页面可以编辑。

这些内容是 prompt 指引，并非强制机制，无法保证每笔 commit 都包含署名。
插件不执行 Git、不安装 hook、不修改 Git 配置、Codex／Claude 配置，也不
改写既有 commits。插件加入的 prompt 会要求保留既有作者与共同作者署名，
包括其他 agents 已加入的署名。

## 设置页面

![DSH 设置中的 Git 风格页面](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/settings-zh.png)

两个字段都是可选的，各自独立工作，留空就不加入任何内容。预览会显示插件
实际加入的内容；保存后的修改会应用到之后的回合，不需要重启 host。

## 在会话中的效果

![DSH 会话执行 commit](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/commit-session-zh.png)

指令只说了「commit 起来」，会话就按照配置的风格撰写消息，并补上共同
作者署名。

![git log 显示生成的 commit](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/git-log-zh.png)

commit 保留了仓库原本的作者，并带着署名 trailer。

界面截图取自 DSH 的中文界面。

## 从 npm 安装

```sh
dsh plugin --profile web add dsh-git-style-zeta
# 重启 host
```

每个 profile 都是独立的安装根。请将 `web` 换成目标 profile，并在每个需要
这些指引的 profile 分别安装。

## 配置

打开设置并选择 **Git 风格**。保存会在 host 的设置文档写入用户层，字段上
的「在此設定」标记就是这样来的；点击「改用 profile 的值」会再清除这一层。

| 字段 | 默认 | 用途 |
|---|---|---|
| `git-commit-instructions` | `""` | Commit 消息 |
| `git-pr-instructions` | `""` | PR 标题与描述 |

字段省略、`null`、空字符串或仅含空白时，对应的 prompt 区段不会加入。

若要让 profile 自带默认值——例如 headless host，或没有设置存储的机器——
请改配置 profile 的 `cordis.patch.yml`，通常位于
`$DSH_HOME/profiles/web/cordis.patch.yml`。bundle 已插入 `git-style-zeta`
这一行，因此用 `id` 覆盖，不要再次 `insert`：

```yaml
- id: git-style-zeta
  config:
    git-commit-instructions: |-
      使用 Conventional Commits：标题不超过 50 字，正文说明为什么要改。
      消息结尾必须有这一行 trailer，且只出现一次：
      Co-authored-by: DeepSeek Harness <noreply@deepseek.com>
      这一行不存在时，在 trailer 区块前空一行后补上。
    git-pr-instructions: |-
      标题用一句话说明改完后的行为。
      正文写问题、改完后的行为，以及实际跑过的检查；区分通过、失败与未执行。
      正文必须包含这一行，且只出现一次：
      Generated with [DeepSeek Harness](https://deepseek.com/harness/).
      这一行不存在时，补在结尾附近、任何尾端隐藏标记之前。
```

这一行就是设置页叠在上面的那一层，所以设置页有值时以设置页为准。DSH
应用覆盖时会替换整行 `config`，两个字段都要使用时请在覆盖中一并保留。

插件会按原文加入你的配置，并要求模型保留既有作者与共同作者。每条规则请
写成模型看字面就能判定的形式：指明确切的那一行、说明只出现一次、并交代
缺少时该怎么做。像「只在缺少时加入」这种需要模型自行判断的条件比较容易
被误读——实际演示中就有一次被解读成要用户开口才加，结果没补上 trailer。
请勿在 prompt 文本中放入凭证。只有加载此插件的 DSH profile 会受影响。

## 更新

明确指定版本安装，再重启 host：

```sh
dsh plugin --profile web add dsh-git-style-zeta@0.2.1
```

## 卸载

```sh
dsh plugin --profile web remove dsh-git-style-zeta
# 重启 host
```

如果曾在 profile 的 `cordis.patch.yml` 加过 `git-style-zeta` 覆盖，一并
移除。没有需要还原的 Git hook 或 Git 配置，既有 commits 保持不变。

## 维护者

执行 `npm test` 可检查源码。Release 自动化与 npm Trusted Publishing 配置
请见 [docs/releasing.md](docs/releasing.md)，截图条件记录在
[docs/images/README.md](docs/images/README.md)。

以 [MIT 许可证](LICENSE) 发布。
