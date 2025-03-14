import HomeView from "../features/Home/views/HomeView.vue";
import {createRouter, createWebHistory, type RouteRecordRaw} from "vue-router";
import SignIn from "../features/Auth/views/SignIn.vue";
import ForbiddenView from "../features/Core/views/ForbiddenView.vue";
import NotFoundView from "../features/Core/views/NotFoundView.vue";
import {useAuth} from "../composables/useAuth.ts";
import RoleSelection from "../features/Auth/views/RoleSelection.vue";
import {doc, getDoc} from "firebase/firestore";
import {db} from "../firebase/app.ts";
import {USER_COLLECTION_NAME} from "../models/User.ts";

const protectRouteMeta = {
    isProtected: true
}

const guestRouteMeta = {
    isGuestRoute: true,
}

const unprotectRouteMeta = {
    isProtected: false
}

/*
const patientRouteMeta = {
    isPatientRoute: true
}

const doctorRouteMeta = {
    isDoctorRoute: true
}
*/

const routes: Readonly<RouteRecordRaw[]> = [{
    path: '/', component: SignIn, name: 'SignIn', meta: {...unprotectRouteMeta, ...guestRouteMeta}
}, {
    path: '/role-selector', component: RoleSelection, name: 'RoleSelection', meta: protectRouteMeta,
}, {
    path: '/home/:userId', component: HomeView, name: 'Home', meta: protectRouteMeta
}, {
    path: '/forbidden', component: ForbiddenView, name: 'Forbidden', meta: unprotectRouteMeta,
}, {
    path: '/:pathMatch(.*)*', component: NotFoundView, name: 'NotFound', meta: unprotectRouteMeta,
}]

export const index = createRouter({
    history: createWebHistory(), routes
})

index.beforeEach(async (to, _from) => {
    const { user, getCurrentlySignedInUser } = useAuth();

    const currentUser = user?.value ?? await getCurrentlySignedInUser();

    if (to.name === 'RoleSelection') {
        if (currentUser) {
            const userDocRef = doc(db, USER_COLLECTION_NAME, currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().role) {
                return { name: 'Home' };
            }
        }
    }

    if (to.meta.isProtected && !currentUser) {
        return { name: 'Forbidden' };
    }

    if (to.meta.isGuestRoute && currentUser) {
        return {name: 'Home', params: {userId: currentUser.uid}};
    }

    return true;
});
