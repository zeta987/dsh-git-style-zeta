[English](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.md) | [繁體中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-TW.md) | [简体中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-CN.md)

# dsh-git-style-zeta

為 DeepSeek Harness（DSH）提供可設定的 Git commit 與 PR 指引。插件透過
DSH 原生 system prompt 加入兩個選用區段：`git-commit-instructions` 與
`git-pr-instructions`。

這些內容是 prompt 指引，並非強制機制，無法保證每筆 commit 都包含署名。
插件不執行 Git、不安裝 hook、不變更 Git 設定、Codex／Claude 設定，也不
改寫既有 commits。插件加入的 prompt 會要求保留既有作者與共同作者署名，
包含其他 agents 已加入的署名。

## 實際畫面

![DSH 原生插件清單顯示 dsh-git-style-zeta 已啟用](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/plugin-list-zh.png)

插件已載入 DSH 原生插件清單。

![DSH system prompt 顯示已設定的 Git commit 指令](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/system-prompt-zh.png)

在 DSH 展開的 system prompt 中查看設定內容。

## 從 npm 安裝

```sh
dsh plugin --profile web add dsh-git-style-zeta
# 重新啟動 host
```

每個 profile 都是獨立的安裝根。請將 `web` 換成目標 profile，並在每個需要
這些指引的 profile 各自安裝。

## 設定

在 profile 的 `cordis.patch.yml` 加入覆寫，通常位於
`$DSH_HOME/profiles/web/cordis.patch.yml`（`$DSH_HOME` 預設為 `~/.dsh`）。
bundle 已插入 `git-style-zeta` 這一列，因此以 `id` 覆寫，不要再次 `insert`：

```yaml
- id: git-style-zeta
  config:
    git-commit-instructions: |-
      使用 Conventional Commits，標題簡潔並說明修改原因。
      僅在不存在時加入 Co-authored-by: Name <email>。
    git-pr-instructions: |-
      說明問題、修改後的行為，以及實際執行的檢查。
      保留既有署名與範本中的隱藏標記。
```

| 欄位 | 預設 | 用途 |
|---|---|---|
| `git-commit-instructions` | `""` | Commit 訊息 |
| `git-pr-instructions` | `""` | PR 標題與描述 |

兩欄獨立運作。省略、`null`、空字串或僅含空白時，對應的 prompt 區段不會
加入。DSH 套用覆寫時會取代整列 `config`，兩欄都要使用時請在覆寫中一併
保留。

插件會依原文加入妳的設定，並要求模型保留既有作者與共同作者。請勿在
prompt 文字中放入憑證。只有載入此插件的 DSH host 與 profile 會受影響。

## 更新

明確指定版本安裝，再重新啟動 host：

```sh
dsh plugin --profile web add dsh-git-style-zeta@0.1.0
```

## 移除

先從 profile 的 `cordis.patch.yml` 移除 `git-style-zeta` 覆寫，再執行：

```sh
dsh plugin --profile web remove dsh-git-style-zeta
# 重新啟動 host
```

沒有需要還原的 Git hook 或 Git 設定，既有 commits 維持不變。

## 維護者

執行 `npm test` 可檢查原始碼。Release 自動化與 npm Trusted Publishing 設定
請見 [docs/releasing.md](docs/releasing.md)。

以 [MIT 授權](LICENSE) 發布。
