import { ref, readonly, onMounted } from 'vue';
import { auth, signInWithPopup, provider, signOut, onAuthStateChanged } from "../firebase/app";
import type { User } from 'firebase/auth';

export function useAuth() {
    const user = ref<User | null>(null);
    const isLoading = ref(true);
    const error = ref<Error | null>(null);

    onMounted(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                user.value = currentUser;
                isLoading.value = false;
            },
            (err) => {
                error.value = err;
                isLoading.value = false;
            }
        );

        return () => unsubscribe();
    });

    async function signIn() {
        try {
            isLoading.value = true;
            error.value = null;
            const result = await signInWithPopup(auth, provider);
            user.value = result.user;
            return result.user;
        } catch (err) {
            error.value = err instanceof Error ? err : new Error('Unknown error during sign in');
            console.error(error.value);
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    async function handleSignOut() {
        try {
            isLoading.value = true;
            error.value = null;
            await signOut(auth);
            user.value = null;
        } catch (err) {
            error.value = err instanceof Error ? err : new Error('Unknown error during sign out');
            console.error(error.value);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        user: readonly(user),
        isAuthenticated: readonly(ref(() => !!user.value)),
        isLoading: readonly(isLoading),
        error: readonly(error),
        signIn,
        signOut: handleSignOut
    };
}

export type AuthState = ReturnType<typeof useAuth>;