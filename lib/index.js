import Schema from '@deepseek-ai/schemastery';

/** Cordis plugin name. */
export const name = 'dsh-git-style-zeta';

/** DSH owns the prompt registry and the lifetime of its registrations. */
export const inject = ['systemPrompt'];

/**
 * Empty instructions disable that section; no attribution identity is assumed.
 * Both fields are volatile: the settings form edits them through the profile
 * patch, and the Loader commits a change into the running references instead
 * of remounting the plugin.
 */
export const Config = Schema.object({
  'git-commit-instructions': Schema.string().default('').volatile(),
  'git-pr-instructions': Schema.string().default('').volatile(),
});

/**
 * Settings namespace shared with the browser half, which opens it through
 * `ctx.configForms.get`. DSH names a form by its profile entry id, so this must
 * match the `id` of the bundle row in `cordis.patch.yml`; renaming that row
 * detaches the settings page.
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
    // A volatile reference: capture the current text for this registration.
    const instructions = config[field].get();
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
 * The bundle row's `config` applies on its own. A settings page edit reaches the
 * running references as a volatile update, which re-registers the sections in
 * place. The browser half ships its own page, so a mounted settings service is
 * told not to generate one for this entry.
 * @param {object} ctx - The injected Cordis context.
 * @param {object} config - Instruction references validated by Cordis.
 * @returns {void}
 */
export function apply(ctx, config) {
  let dispose = register(ctx, config);

  ctx.effect(() => () => dispose(), 'git-style-zeta: prompt sections');

  ctx.on('loader/volatile-update', () => {
    dispose();
    dispose = register(ctx, config);
  });

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber), 'git-style-zeta: settings page');
  });
}
