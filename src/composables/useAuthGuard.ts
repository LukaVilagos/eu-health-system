import { inject } from "vue";
import { authKey } from "./authKey";
import type { ComputedRef } from "vue";
import type { User } from "firebase/auth";

interface AuthReturn {
  user: ComputedRef<User | null>;
  isAuthenticated: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<null>;
  getCurrentlySignedInUser: () => Promise<User | null>;
  cleanup: () => void;
}

export function useAuthGuard(): AuthReturn {
  const auth = inject(authKey) as AuthReturn | undefined;

  if (!auth) {
    throw new Error(
      "Auth was not provided. Make sure your component is within the auth provider scope."
    );
  }

  return auth;
}

export function useAuthenticatedUser(): User {
  const { user, isAuthenticated } = useAuthGuard();

  if (!isAuthenticated.value || !user.value) {
    throw new Error("This operation requires an authenticated user");
  }

  return user.value;
}
