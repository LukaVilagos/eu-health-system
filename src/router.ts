import HomeView from "./views/HomeView.vue";
import {createRouter, createWebHistory, type RouteRecordRaw} from "vue-router";
import SignIn from "./views/SignIn.vue";
import ForbiddenView from "./views/ForbiddenView.vue";
import NotFoundView from "./views/NotFoundView.vue";
import {useAuth} from "./composables/useAuth.ts";
import RoleSelection from "./views/RoleSelection.vue";
import {doc, getDoc} from "firebase/firestore";
import {db} from "./firebase/app.ts";

const protectRouteMeta = {
    isProtected: true
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
    path: '/', component: SignIn, name: 'SignIn', meta: unprotectRouteMeta
}, {
    path: '/role-selector', component: RoleSelection, name: 'RoleSelection', meta: protectRouteMeta,
}, {
    path: '/home', component: HomeView, name: 'Home', meta: protectRouteMeta
}, {
    path: '/forbidden', component: ForbiddenView, name: 'Forbidden', meta: unprotectRouteMeta,
}, {
    path: '/:pathMatch(.*)*', component: NotFoundView, name: 'NotFound', meta: unprotectRouteMeta,
}]

export const router = createRouter({
    history: createWebHistory(), routes
})

router.beforeEach(async (to, _from) => {
    const { user, getCurrentlySignedInUser } = useAuth();

    const currentUser = user?.value ?? await getCurrentlySignedInUser();

    if (to.name === 'RoleSelection') {
        if (currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().role) {
                return { name: 'Home' };
            }
        }
    }

    if (to.meta.isProtected && !currentUser) {
        return { name: 'Forbidden' };
    }

    return true;
});
