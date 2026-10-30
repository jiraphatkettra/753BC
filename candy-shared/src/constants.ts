export const CANDY_PREFIX = "candy:";
export const CANDY_INTERACTION_PREFIX = "candy:";

export const CANDY_INTERACTION_TYPES = {
  CLAIM: "candy:claim:",
  PAGER: "candy:pg:",
  BTN: "candy:btn:",
  REDEEM_MODAL: "candy:redeem:modal",
  REDEEM_SUBMIT: "candy:redeem:submit",
  CONFIRM: "candy:confirm:",
} as const;

export const CANDY_THEME = {
  DEFAULT_COLOR: "#A0714F",
  DECO_LINE: "୨ৎ . 753BC x Trick or Treat . ୨ৎ",
  DIVIDER_LINE: "◠".repeat(24),
  ACCENT_ORANGE: "#F97316",
  DARK_BG: "#070809",
} as const;

export const CANDY_BUTTON_ACTIONS = [
  "claim",
  "balance",
  "leaderboard",
  "rules",
  "redeem",
  "history",
  "link",
  "none",
] as const;

export type CandyButtonAction = (typeof CANDY_BUTTON_ACTIONS)[number];

