import Schema from '@deepseek-ai/schemastery';

/** Cordis plugin name. */
export const name = 'dsh-git-style-zeta';

/** DSH owns the prompt registry and the lifetime of its registrations. */
export const inject = ['systemPrompt'];

/** Empty instructions disable that section; no attribution identity is assumed. */
export const Config = Schema.object({
  'git-commit-instructions': Schema.string().default(''),
  'git-pr-instructions': Schema.string().default(''),
});

/**
 * Settings namespace shared with the browser half, which binds it through
 * `ctx.settingsScope`. The same `Config` schema resolves both layers, so the
 * bundle row's `config` is the base the settings page reverts a field to.
 */
export const SETTINGS_NAMESPACE = 'git-style-zeta';

/** Field name, section suffix, heading, prompt order, and what it applies to. */
const TARGETS = [
  ['git-commit-instructions', 'commit', 'Git commit instructions', 10000, 'Git commit messages'],
  ['git-pr-instructions', 'pr', 'Git pull request instructions', 10010, 'pull request titles and descriptions'],
];

/**
 * Register the sections one configuration turns on.
 * @param {object} ctx - The injected Cordis context.
 * @param {object} config - Instruction strings validated by Cordis.
 * @returns {() => void} Disposer removing every registration this call made.
 */
function register(ctx, config) {
  const disposers = [];
  for (const [field, kind, title, order, subject] of TARGETS) {
    const instructions = config[field];
    if (!instructions.trim()) continue;
    const variable = `git_style_zeta_${kind}_instructions`;
    // Values are not recursively interpolated, including on DSH releases
    // predating section({ interpolate: false }).
    disposers.push(ctx.systemPrompt.variable(variable, () => instructions));
    disposers.push(ctx.systemPrompt.section({
      name: `git-style-zeta:${kind}`,
      order,
      text: `## ${title}\n\nApply the following guidance when preparing ${subject} in this DSH session. It does not authorize committing, pushing, or publishing.\n\n{{${variable}}}\n\nPreserve existing authors and co-author attribution, including attribution from other agents. Do not replace another author's attribution or add duplicate attribution. Do not rewrite existing commits solely to apply this guidance.`,
    }));
  }
  return () => {
    for (const dispose of disposers.splice(0).reverse()) dispose();
  };
}

/**
 * Contribute configured guidance without inspecting or modifying Git state.
 *
 * The bundle row's `config` applies on its own. When the host mounts a settings
 * provider, the same schema is installed as a settings section, so the settings
 * page edits a user layer over that row and every change re-registers the
 * sections in place.
 * @param {object} ctx - The injected Cordis context.
 * @param {object} config - Instruction strings validated by Cordis.
 * @returns {void}
 */
export function apply(ctx, config) {
  let source = () => config;
  let dispose = register(ctx, source());

  const reapply = () => {
    dispose();
    dispose = register(ctx, source());
  };

  ctx.effect(() => () => dispose(), 'git-style-zeta: prompt sections');

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config, {
      setSource: (current) => { source = current; },
      onChange: reapply,
    });
  });
}
