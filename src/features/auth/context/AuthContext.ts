import { createContext } from "react";
import type { AuthContextValue } from "../model/auth.types";

/**
 * Lives in its own module so the provider file only exports a component —
 * which is what React Fast Refresh requires.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
