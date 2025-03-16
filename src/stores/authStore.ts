import { defineStore } from "pinia";
import {
  auth,
  onAuthStateChanged,
  provider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "../firebase/app";
import { computed, ref } from "vue";
import { getUserDocument } from "../models/User";
import type { User } from "firebase/auth";
import type { UserSchemaType } from "../models/User";
import { useTypedRouter } from "../composables/useTypedRouter";
import { useQueryClient } from "@tanstack/vue-query";
import { authKeys } from "../queries/queryAuth";

export type AuthUser = Omit<User, "displayName"> &
  Partial<UserSchemaType> & {
    displayName: string | null;
  };

export const useAuthStore = defineStore("auth", () => {
  const router = useTypedRouter();
  const queryClient = useQueryClient();

  const firebaseUser = ref<User | null>(null);
  const firestoreData = ref<UserSchemaType | null>(null);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);
  const isInitialized = ref(false);

  let authInitResolve: () => void;
  const authInitialized = new Promise<void>((resolve) => {
    authInitResolve = resolve;
  });

  const user = computed<AuthUser | null>(() => {
    if (!firebaseUser.value) return null;

    return {
      ...firebaseUser.value,
      ...firestoreData.value,
    };
  });

  const isAuthenticated = computed(() => !!firebaseUser.value);

  async function fetchUserDocument(uid: string) {
    try {
      firestoreData.value = await getUserDocument(uid);
    } catch (err) {
      console.error("Error fetching user document:", err);
    }
  }

  function initAuth() {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        firebaseUser.value = currentUser;

        if (currentUser) {
          isLoading.value = true;
          await fetchUserDocument(currentUser.uid);
        } else {
          firestoreData.value = null;
        }

        isLoading.value = false;

        queryClient.invalidateQueries({ queryKey: authKeys.user });

        if (!isInitialized.value) {
          isInitialized.value = true;
          authInitResolve();
        }
      },
      (err) => {
        error.value = err;
        isLoading.value = false;

        if (!isInitialized.value) {
          isInitialized.value = true;
          authInitResolve();
        }
      }
    );

    return unsubscribe;
  }

  async function signIn() {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await signInWithPopup(auth, provider);

      const userData = await getUserDocument(result.user.uid);

      if (!userData) {
        await router.typedPush({ name: "RoleSelection", params: {} });
      } else {
        firestoreData.value = userData;
        await router.typedPush({
          name: "Home",
          params: {},
        });
      }
      queryClient.invalidateQueries({ queryKey: authKeys.user });

      return result.user;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Unknown error during sign in");
      console.error(error.value);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function signOut() {
    try {
      isLoading.value = true;
      error.value = null;

      await firebaseSignOut(auth);
      firebaseUser.value = null;
      firestoreData.value = null;

      await router.push({ name: "SignIn" });

      queryClient.invalidateQueries({ queryKey: authKeys.user });

      return null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Unknown error during sign out");
      console.error(error.value);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function waitForAuthInit(): Promise<void> {
    return authInitialized;
  }

  const unsubscribe = initAuth();

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", unsubscribe);
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    signIn,
    signOut,
    waitForAuthInit,
    fetchUserDocument,
    cleanup: unsubscribe,
  };
});
