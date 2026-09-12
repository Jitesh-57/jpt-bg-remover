/**
 * workspace-config.ts — which controls the AI app workspace shows.
 *
 * The style picker and the Solo/Group/Custom tabs are built and working; they
 * are hidden for now because each preset is a different generation and a
 * visitor browsing styles spends credits without meaning to. Flip either flag
 * back to true to restore the control — nothing else needs changing, and the
 * code behind them is untouched.
 *
 * With the picker hidden, a generation uses the app's own tuned prompt with no
 * preset modifier, which is the app's default look.
 */

/** The Solo / Group / Custom tabs above the style grid. */
export const SHOW_PRESET_TABS = false;

/** The grid of style thumbnails. */
export const SHOW_STYLE_PICKER = false;
