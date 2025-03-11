import HomeView from "./views/HomeView.vue";
import {createRouter, createWebHistory, type RouteRecordRaw} from "vue-router";
import SignIn from "./views/SignIn.vue";
import ForbiddenView from "./views/ForbiddenView.vue";
import NotFoundView from "./views/NotFoundView.vue";
import {useAuth} from "./composables/useAuth.ts";

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
    path: '/home', component: HomeView, name: 'Home', meta: protectRouteMeta
}, {
    path: '/forbidden', component: ForbiddenView, name: 'Forbidden', meta: unprotectRouteMeta,
}, {
    path: '/:pathMatch(.*)*', component: NotFoundView, name: 'NotFound', meta: unprotectRouteMeta,
}]

export const router = createRouter({
    history: createWebHistory(), routes
})

router.beforeEach(async (to) => {
    const {getCurrentlySignedInUser} = useAuth()
    const user = await getCurrentlySignedInUser()
    if (to.meta.isProtected && !user) {
        return {name: 'Forbidden'}
    }
})