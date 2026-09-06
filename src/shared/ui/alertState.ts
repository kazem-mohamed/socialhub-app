export type AlertColor = "success" | "warning" | "danger" | "primary";

/**
 * Feedback banner state, previously re-declared in Login, Register, Setting,
 * PostForm, PostCard and Profile.
 */
export interface AlertState {
  isVisible: boolean;
  color: AlertColor;
  title: string;
  description: string;
}

export const HIDDEN_ALERT: AlertState = {
  isVisible: false,
  color: "success",
  title: "",
  description: "",
};
