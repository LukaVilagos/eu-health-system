import {computed, effectScope, ref} from 'vue';
import {auth, db, onAuthStateChanged, provider, signInWithPopup, signOut as firebaseSignOut} from "../firebase/app";
import {getCurrentUser} from "vuefire";
import type {User} from 'firebase/auth';
import {doc, getDoc} from "firebase/firestore";
import {useRouter} from 'vue-router';


interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
}

export function useAuth() {
    const scope = effectScope();
    const router = useRouter();

    const state = ref<AuthState>({
        user: null, isLoading: true, error: null
    });

    async function handleAuthOperation<T>(operation: () => Promise<T>, onSuccess?: (result: T) => void): Promise<T | null> {
        try {
            state.value.isLoading = true;
            state.value.error = null;
            const result = await operation();
            if (onSuccess) {
                onSuccess(result);
            }
            return result;
        } catch (err) {
            state.value.error = err instanceof Error ? err : new Error('Unknown authentication error');
            console.error(state.value.error);
            return null;
        } finally {
            state.value.isLoading = false;
        }
    }

    function setupAuthStateListener() {
        getCurrentUser().catch(err => {
            state.value.error = err instanceof Error ? err : new Error('Error getting current user');
            state.value.isLoading = false;
        });

        return onAuthStateChanged(auth, (currentUser) => {
            state.value.user = currentUser;
            state.value.isLoading = false;
        }, (err) => {
            state.value.error = err;
            state.value.isLoading = false;
        });
    }

    const unsubscribe = setupAuthStateListener();

    async function signIn() {
        return handleAuthOperation(async () => {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await router.push({name: 'RoleSelection'});
            } else {
                await router.push({name: 'Home'});
            }

            return user;
        }, (resultUser) => {
            state.value.user = resultUser;
        });
    }

    async function signOut() {
        return handleAuthOperation(async () => {
            await firebaseSignOut(auth);
            return null;
        }, async () => {
            state.value.user = null;
            await router.push({name: 'SignIn'});
        });
    }

    async function getCurrentlySignedInUser() {
        return await getCurrentUser();
    }

    const cleanup = () => {
        if (unsubscribe) {
            unsubscribe();
        }
        scope.stop();
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', unsubscribe);
    }

    const isAuthenticated = scope.run(() => computed(() => !!state.value.user));

    return {
        user: scope.run(() => computed(() => state.value.user)),
        isAuthenticated,
        isLoading: scope.run(() => computed(() => state.value.isLoading)),
        error: scope.run(() => computed(() => state.value.error)),
        signIn,
        signOut,
        getCurrentlySignedInUser,
        cleanup
    };
}