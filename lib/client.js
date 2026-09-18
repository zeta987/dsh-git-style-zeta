/*
 * dsh-git-style-zeta — browser half.
 *
 * One settings section, "Git style", over the plugin's own settings namespace.
 * The page edits the two instruction fields this plugin contributes to the
 * system prompt and shows which prompt sections the current text turns on.
 *
 * Reads and writes go through `ctx.settingsScope`, the native settings
 * transport, so a saved field lands in the host's settings document as a user
 * layer over the bundle row's `config`, and clearing a field hands it back to
 * that row. The host half re-registers its prompt sections on every change, so
 * nothing here asks for a restart.
 *
 * This file is served as-is by `@deepseek-ai/dsh-client-modules`, in the lazy
 * CommonJS factory shape the loader expects. It uses only `React` from the
 * platform seed table, so it needs no bundler and no `dsh.client.external`.
 */
window.__ModuleLoader__.load({
  id: 'dsh-git-style-zeta',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    const React = require('react')
    const h = React.createElement

    const NAMESPACE = 'git-style-zeta'
    const STYLE_ID = 'dsh-git-style-zeta-style'

    /** Draft key to the settings field it edits, shared with `lib/index.js`. */
    const FIELDS = {
      commit: 'git-commit-instructions',
      pr: 'git-pr-instructions',
    }

    /** Prompt sections, mirroring the headings the host half registers. */
    const SECTIONS = [
      { key: 'commit', title: 'Git commit instructions', subject: 'Git commit messages' },
      { key: 'pr', title: 'Git pull request instructions', subject: 'pull request titles and descriptions' },
    ]

    // Every user-facing string of the page. `zh` keeps Traditional Chinese
    // wording; the active dictionary follows the DSH UI language.
    const STRINGS = {
      en: {
        title: 'Git style',
        subtitle: 'Guidance this plugin adds to the system prompt when preparing Git commit messages and pull requests. It is prompt text, not enforcement, and it never runs Git.',
        loading: 'Loading settings…',
        unavailable: 'This host keeps preferences process-local, so the fields cannot be saved here. Configure the plugin row in the profile’s cordis.patch.yml instead.',
        commitLabel: 'Commit instructions',
        commitHint: 'Added as written under a "Git commit instructions" prompt section. Leave empty to add nothing.',
        commitPlaceholder: 'Use Conventional Commits: a subject under 50 characters, and a body saying why the change was needed.\nEnd the message with this trailer exactly once:\nCo-authored-by: DeepSeek Harness <noreply@deepseek.com>\nIf that exact line is missing, append it with one blank line before the trailer block.',
        prLabel: 'Pull request instructions',
        prHint: 'Added as written under a "Git pull request instructions" prompt section. Leave empty to add nothing.',
        prPlaceholder: 'Title the pull request with the resulting behavior in one line.\nIn the body: the problem, the behavior after the change, and the checks actually run; distinguish passed, failed, and unexecuted checks.\nThe body must contain this exact line once:\nGenerated with [DeepSeek Harness](https://deepseek.com/harness/).\nIf it is missing, append it near the end, before any trailing hidden metadata markers.',
        sectionOn: 'prompt section on',
        sectionOff: 'prompt section off',
        overridden: 'set here',
        inherited: 'from the profile',
        revert: 'Use the profile value',
        save: 'Save',
        discard: 'Discard changes',
        saved: 'Saved. New turns assemble the prompt with it.',
        unsaved: 'Unsaved changes',
        errorPrefix: 'Error: ',
        notice: 'Both fields are sent to the model as written, together with a request to preserve existing authors and co-author attribution. Do not put credentials here. Only this DSH profile is affected.',
        previewTitle: 'Prompt preview',
        previewEmpty: 'Both fields are empty, so this plugin adds nothing to the system prompt.',
      },
      zh: {
        title: 'Git 風格',
        subtitle: '這個插件在撰寫 Git commit 訊息與 pull request 時加入系統提示的指引。它是提示文字而非強制規則，也不會執行 Git。',
        loading: '載入設定中…',
        unavailable: '這個主機只把偏好保留在行程內，所以這裡無法儲存。請改在 profile 的 cordis.patch.yml 設定這個插件列。',
        commitLabel: 'Commit 指令',
        commitHint: '原文加入「Git commit instructions」提示區段。留空則不加入任何內容。',
        commitPlaceholder: '使用 Conventional Commits：標題不超過 50 字，本文說明為什麼要改。\n訊息結尾必須有這一行 trailer，且只出現一次：\nCo-authored-by: DeepSeek Harness <noreply@deepseek.com>\n這一行不存在時，在 trailer 區塊前空一行後補上。',
        prLabel: 'Pull request 指令',
        prHint: '原文加入「Git pull request instructions」提示區段。留空則不加入任何內容。',
        prPlaceholder: '標題用一句話說明改完後的行為。\n本文寫問題、改完後的行為，以及實際跑過的檢查；區分通過、失敗與未執行。\n本文必須包含這一行，且只出現一次：\nGenerated with [DeepSeek Harness](https://deepseek.com/harness/).\n這一行不存在時，補在結尾附近、任何尾端隱藏標記之前。',
        sectionOn: '提示區段已開啟',
        sectionOff: '提示區段未開啟',
        overridden: '在此設定',
        inherited: '沿用 profile',
        revert: '改用 profile 的值',
        save: '儲存',
        discard: '捨棄變更',
        saved: '已儲存。之後的回合會帶著它組裝提示。',
        unsaved: '尚未儲存',
        errorPrefix: '錯誤：',
        notice: '兩個欄位會原文送給模型，並附帶保留既有作者與共同作者署名的要求。請勿在這裡填入憑證。只有這個 DSH profile 會受影響。',
        previewTitle: '提示預覽',
        previewEmpty: '兩個欄位都是空的，這個插件不會加入任何系統提示內容。',
      },
    }

    const CSS = `
.gz{display:flex;flex-direction:column;gap:16px;min-width:0;padding:2px 0 28px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.5;container-type:inline-size}
.gz *{box-sizing:border-box}
.gz_title{margin:0;font-size:20px;line-height:28px;font-weight:650}
.gz_subtitle{margin:3px 0 0;max-width:72ch;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.gz_message{padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:13px;overflow-wrap:anywhere}
.gz_message[data-error="true"]{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger)}
.gz_card{display:flex;flex-direction:column;gap:14px;min-width:0;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.gz_field{display:flex;flex-direction:column;gap:5px;min-width:0}
.gz_labelRow{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.gz_labelSide{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.gz_label{font-size:13px;font-weight:600}
.gz_hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:17px}
.gz_text{width:100%;min-height:132px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-family:var(--dsw-font-mono);font-size:13px;line-height:19px;resize:vertical}
.gz_text:focus-visible,.gz_button:focus-visible,.gz_link:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.gz_badge{display:inline-flex;align-items:center;min-height:18px;padding:0 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;white-space:nowrap}
.gz_badge[data-on="true"]{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-state-success-tertiary);border-color:transparent}
.gz_link{padding:0;border:0;background:none;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12px;cursor:pointer}
.gz_link:disabled{opacity:.5;cursor:default}
.gz_notice{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;max-width:80ch}
.gz_preview{display:flex;flex-direction:column;gap:6px;min-width:0}
.gz_previewTitle{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:600}
.gz_pre{margin:0;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-mono);font-size:12px;line-height:18px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto}
.gz_actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding-top:4px;border-top:1px solid var(--dsw-alias-border-l1)}
.gz_actionsGroup{display:flex;gap:6px;flex-wrap:wrap}
.gz_button{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:5px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:background .16s ease,color .16s ease,border-color .16s ease,opacity .16s ease}
.gz_button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.gz_button:disabled{opacity:.5;cursor:default}
.gz_button[data-primary="true"]{border-color:transparent;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-inverted)}
.gz_button[data-primary="true"]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
@media(max-width:760px){.gz_button{min-height:38px}}
@media(prefers-reduced-motion:reduce){.gz_button{transition:none}}
`

    function adoptStyles(doc) {
      if (!doc || typeof doc.getElementById !== 'function' || doc.getElementById(STYLE_ID)) return
      const style = doc.createElement('style')
      style.id = STYLE_ID
      style.textContent = CSS
      doc.head.appendChild(style)
    }

    /** Pick the dictionary for the active locale; anything not Chinese reads English. */
    function pickStrings(localeId) {
      return String(localeId || '').toLowerCase().startsWith('zh') ? STRINGS.zh : STRINGS.en
    }

    /** Read the active locale id from the client context; English when absent. */
    function localeIdOf(ctx) {
      const locale = ctx && ctx.locale
      if (!locale || typeof locale.getSnapshot !== 'function') return 'en'
      const snapshot = locale.getSnapshot()
      return (snapshot && snapshot.active) || 'en'
    }

    /** Subscribe to the locale runtime when it exists; otherwise stay English. */
    function useStrings(ctx) {
      const locale = ctx && ctx.locale
      const subscribe = React.useCallback(
        (listener) => (locale && typeof locale.subscribe === 'function' ? locale.subscribe(listener) : () => {}),
        [locale],
      )
      const getSnapshot = React.useCallback(() => localeIdOf(ctx), [locale])
      return pickStrings(React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot))
    }

    /** The editable shape of one settings section. */
    function draftFrom(section) {
      return {
        commit: readField(section, FIELDS.commit),
        pr: readField(section, FIELDS.pr),
      }
    }

    /** One field of a settings layer as a string, whatever the layer is missing. */
    function readField(section, field) {
      const value = section === null || typeof section !== 'object' ? undefined : section[field]
      return typeof value === 'string' ? value : ''
    }

    function sameDraft(a, b) {
      return a.commit === b.commit && a.pr === b.pr
    }

    /** A field contributes a prompt section only when it holds more than whitespace. */
    function enabled(value) {
      return value.trim().length > 0
    }

    /** Whether the user layer carries this field, which is what marks an override. */
    function overridden(user, field) {
      return user !== null && typeof user === 'object' && Object.hasOwn(user, field)
    }

    /**
     * The mutation one save needs: a field matching the composition layer is
     * cleared so it keeps inheriting, and anything else is written.
     * @returns Ordered `{ field, value }` writes, where a missing `value` clears.
     */
    function opsFor(draft, snapshot) {
      const base = snapshot && snapshot.base
      const user = snapshot && snapshot.user
      const ops = []
      for (const [key, field] of Object.entries(FIELDS)) {
        const value = draft[key]
        if (value === readField(base, field)) {
          if (overridden(user, field)) ops.push({ field })
        } else if (value !== readField(user, field) || !overridden(user, field)) {
          ops.push({ field, value })
        }
      }
      return ops
    }

    /**
     * The prompt text the host assembles from a draft, mirroring `lib/index.js`.
     * Kept here so the page shows the effect of an edit before it is saved.
     */
    function previewOf(draft, sections) {
      return sections
        .map(({ key, title, subject }) => {
          const instructions = draft[key]
          if (!enabled(instructions)) return null
          return `## ${title}\n\nApply the following guidance when preparing ${subject} in this DSH session.\n\n${instructions.trim()}`
        })
        .filter(Boolean)
        .join('\n\n')
    }

    function Button({ children, onClick, disabled, primary }) {
      return h('button', {
        type: 'button',
        className: 'gz_button',
        disabled,
        'data-primary': primary ? 'true' : undefined,
        onClick,
      }, children)
    }

    function InstructionField({ id, label, hint, placeholder, value, onChange, onRevert, isOverridden, t }) {
      return h('div', { className: 'gz_field' },
        h('div', { className: 'gz_labelRow' },
          h('div', { className: 'gz_labelSide' },
            h('label', { className: 'gz_label', htmlFor: id }, label),
            h('span', { className: 'gz_badge' }, isOverridden ? t.overridden : t.inherited),
            isOverridden ? h('button', { type: 'button', className: 'gz_link', onClick: onRevert }, t.revert) : null),
          h('span', { className: 'gz_badge', 'data-on': enabled(value) ? 'true' : undefined },
            enabled(value) ? t.sectionOn : t.sectionOff)),
        h('textarea', {
          id,
          className: 'gz_text',
          value,
          placeholder,
          spellCheck: false,
          onChange: (e) => onChange(e.target.value),
        }),
        h('div', { className: 'gz_hint' }, hint))
    }

    function createSettingsSection(ctx, scope) {
      function GitStyleSettings() {
        const t = useStrings(ctx)
        const subscribe = React.useCallback((listener) => scope.subscribe(listener), [])
        const getSnapshot = React.useCallback(() => scope.getSnapshot(), [])
        const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

        const saved = React.useMemo(() => draftFrom(snapshot.value), [snapshot])
        const [edits, setEdits] = React.useState(null)
        const [message, setMessage] = React.useState(null)
        const [busy, setBusy] = React.useState(false)

        const draft = edits ?? saved
        const dirty = !sameDraft(draft, saved)
        const preview = previewOf(draft, SECTIONS)

        const patch = (next) => setEdits({ ...draft, ...next })

        async function save() {
          setBusy(true)
          setMessage(null)
          try {
            const ops = opsFor(draft, snapshot)
            for (const op of ops) {
              if (Object.hasOwn(op, 'value')) await scope.set(op.field, op.value)
              else await scope.unset(op.field)
            }
            setEdits(null)
            setMessage({ error: false, text: t.saved })
          } catch (error) {
            setMessage({ error: true, text: t.errorPrefix + String((error && error.message) || error) })
          } finally {
            setBusy(false)
          }
        }

        if (snapshot.status === 'loading') {
          return h('div', { className: 'gz' }, h('div', { className: 'gz_message' }, t.loading))
        }

        return h('div', { className: 'gz' },
          h('div', null,
            h('h2', { className: 'gz_title' }, t.title),
            h('p', { className: 'gz_subtitle' }, t.subtitle)),
          snapshot.status === 'unavailable'
            ? h('div', { className: 'gz_message', 'data-error': 'true' }, t.unavailable)
            : null,
          message ? h('div', { className: 'gz_message', 'data-error': message.error ? 'true' : undefined }, message.text) : null,
          h('div', { className: 'gz_card' },
            h(InstructionField, {
              id: 'gz-commit',
              label: t.commitLabel,
              hint: t.commitHint,
              placeholder: t.commitPlaceholder,
              value: draft.commit,
              onChange: (value) => patch({ commit: value }),
              onRevert: () => patch({ commit: readField(snapshot.base, FIELDS.commit) }),
              isOverridden: overridden(snapshot.user, FIELDS.commit),
              t,
            }),
            h(InstructionField, {
              id: 'gz-pr',
              label: t.prLabel,
              hint: t.prHint,
              placeholder: t.prPlaceholder,
              value: draft.pr,
              onChange: (value) => patch({ pr: value }),
              onRevert: () => patch({ pr: readField(snapshot.base, FIELDS.pr) }),
              isOverridden: overridden(snapshot.user, FIELDS.pr),
              t,
            }),
            h('div', { className: 'gz_notice' }, t.notice),
            h('div', { className: 'gz_preview' },
              h('div', { className: 'gz_previewTitle' }, t.previewTitle),
              h('pre', { className: 'gz_pre' }, preview || t.previewEmpty)),
            h('div', { className: 'gz_actions' },
              h('span', { className: 'gz_hint' }, dirty ? t.unsaved : ''),
              h('div', { className: 'gz_actionsGroup' },
                h(Button, { onClick: () => setEdits(null), disabled: !dirty || busy }, t.discard),
                h(Button, { onClick: save, disabled: !dirty || busy || snapshot.status !== 'ready', primary: true }, t.save)))))
      }
      return GitStyleSettings
    }

    exports.inject = ['slots', 'locale', 'settingsScope']
    exports.apply = (ctx) => {
      adoptStyles(typeof document === 'undefined' ? undefined : document)
      const scope = ctx.settingsScope.bind({ namespace: NAMESPACE })
      const Section = createSettingsSection(ctx, scope)
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'git-style-zeta',
        order: 65,
        label: () => pickStrings(localeIdOf(ctx)).title,
        inject: () => ({}),
      }, Section))
    }

    exports.draftFrom = draftFrom
    exports.enabled = enabled
    exports.FIELDS = FIELDS
    exports.opsFor = opsFor
    exports.overridden = overridden
    exports.pickStrings = pickStrings
    exports.previewOf = previewOf
    exports.readField = readField
    exports.SECTIONS = SECTIONS
    return module.exports
  },
})
