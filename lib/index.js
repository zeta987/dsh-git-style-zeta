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

const targets = [
  ['git-commit-instructions', 'commit', 'Git commit instructions', 10000],
  ['git-pr-instructions', 'pr', 'Git pull request instructions', 10010],
];

/**
 * Contribute configured guidance without inspecting or modifying Git state.
 * @param {object} ctx - The injected Cordis context.
 * @param {object} config - Instruction strings validated by Cordis.
 * @returns {void}
 */
export function apply(ctx, config) {
  for (const [field, kind, title, order] of targets) {
    const instructions = config[field];
    if (!instructions.trim()) continue;
    const variable = `git_style_zeta_${kind}_instructions`;
    // Values are not recursively interpolated, including on DSH releases
    // predating section({ interpolate: false }). The registry owns cleanup.
    ctx.systemPrompt.variable(variable, () => instructions);
    ctx.systemPrompt.section({
      name: `git-style-zeta:${kind}`,
      order,
      text: `## ${title}\n\nApply the following guidance when preparing ${kind === 'commit' ? 'Git commit messages' : 'pull request titles and descriptions'} in this DSH session. It does not authorize committing, pushing, or publishing.\n\n{{${variable}}}\n\nPreserve existing authors and co-author attribution, including attribution from other agents. Do not replace another author's attribution or add duplicate attribution. Do not rewrite existing commits solely to apply this guidance.`,
    });
  }
}
