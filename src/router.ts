import HomeView from "./views/HomeView.vue";
import {createWebHistory, createRouter, type RouteRecordRaw} from "vue-router";
import SignIn from "./views/SignIn.vue";

const protectRouteMeta = {
    isProtected: true
}

const unprotectRouteMeta = {
    isProtected: false
}

const routes: Readonly<RouteRecordRaw[]> = [
    {
        path: '/',
        component: SignIn,
        name: 'SignIn',
        meta: unprotectRouteMeta
    },
    {
        path: '/home',
        component: HomeView,
        name: 'Home',
        meta: protectRouteMeta
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})