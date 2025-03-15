import HomeView from "../features/Home/views/HomeView.vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import SignIn from "../features/Auth/views/SignIn.vue";
import ForbiddenView from "../features/Core/views/ForbiddenView.vue";
import NotFoundView from "../features/Core/views/NotFoundView.vue";
import { useAuth } from "../composables/useAuth.ts";
import RoleSelection from "../features/Auth/views/RoleSelection.vue";
import type { AppRouteName } from "./routeTypes";
import { authGuard, guestGuard, roleSelectionGuard } from "./guards.ts";

const protectRouteMeta = {
  isProtected: true,
};

const guestRouteMeta = {
  isGuestRoute: true,
};

const unprotectRouteMeta = {
  isProtected: false,
};

/*
const patientRouteMeta = {
    isPatientRoute: true
}

const doctorRouteMeta = {
    isDoctorRoute: true
}
*/

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: "/",
    component: SignIn,
    name: "SignIn" as AppRouteName,
    meta: { ...unprotectRouteMeta, ...guestRouteMeta },
  },
  {
    path: "/role-selector",
    component: RoleSelection,
    name: "RoleSelection" as AppRouteName,
    meta: protectRouteMeta,
  },
  {
    path: "/home/:userId",
    component: HomeView,
    name: "Home" as AppRouteName,
    meta: protectRouteMeta,
    props: true,
  },
  {
    path: "/forbidden",
    component: ForbiddenView,
    name: "Forbidden" as AppRouteName,
    meta: unprotectRouteMeta,
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFoundView,
    name: "NotFound" as AppRouteName,
    meta: unprotectRouteMeta,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from) => {
  const { user, getCurrentlySignedInUser } = useAuth();
  const currentUser = user?.value ?? (await getCurrentlySignedInUser());

  if (!currentUser) {
    if (to.meta.isProtected) {
      return { name: "SignIn" };
    }
  }

  const roleGuardResult = await roleSelectionGuard(to, currentUser);
  if (roleGuardResult !== true) return roleGuardResult;

  const authGuardResult = authGuard(to, currentUser);
  if (authGuardResult !== true) return authGuardResult;

  const guestGuardResult = guestGuard(to, currentUser);
  if (guestGuardResult !== true) return guestGuardResult;

  return true;
});
