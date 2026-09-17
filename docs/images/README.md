# Screenshot provenance

Captured from the real DSH 0.1.5-rc.2 Web UI on Windows, 2026-09-18. English
and Chinese are the built-in DSH interface locales. The Traditional Chinese and
Simplified Chinese READMEs share the native Chinese screenshot, as the sibling
plugins do.

- settings-en.png / settings-zh.png: the plugin's own section in DSH Settings,
  after saving both fields. An element screenshot of the settings dialog at a
  1360 by 1080 viewport.
- commit-session-en.png / commit-session-zh.png: a real session in the demo
  repository below, asked only to commit the uncommitted change. Viewport
  screenshots at 1280 by 820.
- git-log-en.png / git-log-zh.png: the same session running
  `git log --format=full -2 --stat`, showing the raw output it returned.

Everything ran in a throwaway `DSH_HOME` and workspace under the ignored `.tmp`
directory, with the production plugin installed as a real DSH bundle through
`dsh plugin --profile web add`. The demo repository is a two-file JavaScript
package whose first commit is authored by a fictional `Sam Rivera
<sam@example.com>`, so the screenshots also show whether an existing author
survives. Commit messages come from the model reading the plugin's prompt
sections; no message, badge, style or prompt content was edited for the images.
DeepSeek was the configured provider, and the account, credentials and sessions
of the daily DSH install were never copied or read.

The English commit session was run twice. The first run used the wording "Add
Co-authored-by: … only when that line is absent", which the model read as
needing an explicit request and skipped; the instruction was reworded to
"unless that exact line is already there" and both languages were then re-run
with the final wording shown in the settings screenshots. The README records
this as guidance on how to phrase an instruction.

Only native navigation, language selection, scrolling, viewport sizing and
direct browser screenshots were used. The temporary browser, server, workspace
and `DSH_HOME` are removed after capture.
