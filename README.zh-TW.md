[English](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.md) | [繁體中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-TW.md) | [简体中文](https://github.com/zeta987/dsh-git-style-zeta/blob/main/README.zh-CN.md)

# dsh-git-style-zeta

為 DeepSeek Harness（DSH）提供可設定的 Git commit 與 pull request 指引。
插件在 DSH 原生 system prompt 加入兩個選用區段，並在設定頁裡有自己的頁面
可以編輯。

這些內容是 prompt 指引，並非強制機制，無法保證每筆 commit 都包含署名。
插件不執行 Git、不安裝 hook、不變更 Git 設定、Codex／Claude 設定，也不
改寫既有 commits。插件加入的 prompt 會要求保留既有作者與共同作者署名，
包含其他 agents 已加入的署名。

## 設定頁面

![DSH 設定中的 Git 風格頁面](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/settings-zh.png)

兩個欄位都是選用的，各自獨立運作，留空就不加入任何內容。預覽會顯示插件
實際加入的內容；儲存後的變更會套用到之後的回合，不需要重新啟動 host。

## 在對話中的效果

![DSH session 執行 commit](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/commit-session-zh.png)

指令只說了「commit 起來」，session 就依照設定的風格撰寫訊息，並補上共同
作者署名。

![git log 顯示產生的 commit](https://raw.githubusercontent.com/zeta987/dsh-git-style-zeta/main/docs/images/git-log-zh.png)

commit 保留了 repo 原本的作者，並帶著署名 trailer。

## 從 npm 安裝

```sh
dsh plugin --profile web add dsh-git-style-zeta
# 重新啟動 host
```

每個 profile 都是獨立的安裝根。請將 `web` 換成目標 profile，並在每個需要
這些指引的 profile 各自安裝。

## 設定

開啟設定並選擇 **Git 風格**。儲存會在 host 的設定文件寫入使用者層，欄位
上的「在此設定」標記就是這樣來的；按「改用 profile 的值」會再清掉這一層。

| 欄位 | 預設 | 用途 |
|---|---|---|
| `git-commit-instructions` | `""` | Commit 訊息 |
| `git-pr-instructions` | `""` | PR 標題與描述 |

欄位省略、`null`、空字串或僅含空白時，對應的 prompt 區段不會加入。

若要讓 profile 自帶預設值——例如 headless host，或沒有設定儲存的機器——
請改設定 profile 的 `cordis.patch.yml`，通常位於
`$DSH_HOME/profiles/web/cordis.patch.yml`。bundle 已插入 `git-style-zeta`
這一列，因此以 `id` 覆寫，不要再次 `insert`：

```yaml
- id: git-style-zeta
  config:
    git-commit-instructions: |-
      使用 Conventional Commits：標題不超過 50 字，本文說明為什麼要改。
      訊息結尾加上 Co-authored-by: DSH <dsh@example.com>，除非這一行已經存在。
      保留其他作者的署名，也不要重寫既有 commit。
    git-pr-instructions: |-
      標題用一句話說明改完後的行為。
      本文寫問題、改完後的行為，以及實際跑過的檢查。
      保留樣板裡既有的署名與隱藏標記。
```

這一列就是設定頁疊在上面的那一層，所以設定頁有值時以設定頁為準。DSH
套用覆寫時會取代整列 `config`，兩欄都要使用時請在覆寫中一併保留。

插件會依原文加入妳的設定，並要求模型保留既有作者與共同作者。指令請寫成
直接的規則：像「只在缺少時加入」這種需要模型自行判讀的條件，會比「除非
這一行已經存在」更容易被誤讀。請勿在 prompt 文字中放入憑證。只有載入此
插件的 DSH profile 會受影響。

## 更新

明確指定版本安裝，再重新啟動 host：

```sh
dsh plugin --profile web add dsh-git-style-zeta@0.2.0
```

## 移除

```sh
dsh plugin --profile web remove dsh-git-style-zeta
# 重新啟動 host
```

如果曾在 profile 的 `cordis.patch.yml` 加過 `git-style-zeta` 覆寫，一併
移除。沒有需要還原的 Git hook 或 Git 設定，既有 commits 維持不變。

## 維護者

執行 `npm test` 可檢查原始碼。Release 自動化與 npm Trusted Publishing 設定
請見 [docs/releasing.md](docs/releasing.md)，截圖條件記錄在
[docs/images/README.md](docs/images/README.md)。

以 [MIT 授權](LICENSE) 發布。
