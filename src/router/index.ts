import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import AuthLayout from "../components/layout/AuthLayout.vue";
import SignInPage from "../modules/auth/pages/SignInPage.vue";
import type { AppRouteName } from "./routeTypes";
import RoleSelectionPage from "../modules/auth/pages/RoleSelectionPage.vue";
import DefaultLayout from "../components/layout/DefaultLayout.vue";
import HomePage from "../pages/HomePage.vue";
import TodoPage from "../modules/todo/pages/TodoPage.vue";
import ProfilePage from "../modules/user/pages/ProfilePage.vue";
import PatientPage from "../pages/PatientPage.vue";
import DoctorPage from "../pages/DoctorPage.vue";
import BlankLayout from "../components/layout/BlankLayout.vue";
import ForbiddenPage from "../pages/ForbiddenPage.vue";
import NotFoundPage from "../pages/NotFoundPage.vue";
import { useAuth } from "../modules/auth/hooks/useAuthHooks";
import {
  authGuard,
  doctorGuard,
  guestGuard,
  patientGuard,
  protectedGuard,
  roleSelectionGuard,
} from "./guards";

const protectRouteMeta = {
  isProtected: true,
};

const guestRouteMeta = {
  isGuestRoute: true,
};

const unprotectRouteMeta = {
  isProtected: false,
};

const patientRouteMeta = {
  isPatientRoute: true,
};

const doctorRouteMeta = {
  isDoctorRoute: true,
};

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: "/",
    component: AuthLayout,
    children: [
      {
        path: "",
        component: SignInPage,
        name: "SignIn" as AppRouteName,
        meta: { ...unprotectRouteMeta, ...guestRouteMeta },
      },
      {
        path: "role-selector",
        component: RoleSelectionPage,
        name: "RoleSelection" as AppRouteName,
        meta: { ...protectRouteMeta },
      },
    ],
  },
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "home",
        component: HomePage,
        name: "Home" as AppRouteName,
        meta: protectRouteMeta,
        props: true,
      },
      {
        path: "todo/:todoId",
        component: TodoPage,
        name: "Todo" as AppRouteName,
        meta: protectRouteMeta,
        props: true,
      },
      {
        path: "profile/:userId",
        component: ProfilePage,
        name: "Profile" as AppRouteName,
        meta: protectRouteMeta,
        props: true,
      },
      {
        path: "patient",
        component: PatientPage,
        name: "Patient" as AppRouteName,
        meta: { ...protectRouteMeta, ...patientRouteMeta },
      },
      {
        path: "doctor",
        component: DoctorPage,
        name: "Doctor" as AppRouteName,
        meta: { ...protectRouteMeta, ...doctorRouteMeta },
      },
    ],
  },
  {
    path: "/",
    component: BlankLayout,
    children: [
      {
        path: "/forbidden",
        component: ForbiddenPage,
        name: "Forbidden" as AppRouteName,
        meta: { ...protectRouteMeta },
      },
      {
        path: "/:pathMatch(.*)*",
        component: NotFoundPage,
        name: "NotFound" as AppRouteName,
        meta: { ...unprotectRouteMeta },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuth();

  await auth.waitForAuthInit();

  const user = auth.user;

  const protectedGuardResult = protectedGuard(to, user);
  if (protectedGuardResult !== true) return protectedGuardResult;

  const roleGuardResult = roleSelectionGuard(to, user);
  if (roleGuardResult !== true) return roleGuardResult;

  const authGuardResult = authGuard(to, user);
  if (authGuardResult !== true) return authGuardResult;

  const guestGuardResult = guestGuard(to, user);
  if (guestGuardResult !== true) return guestGuardResult;

  const patientGuardResult = patientGuard(to, user);
  if (patientGuardResult !== true) return patientGuardResult;

  const doctorGuardResult = doctorGuard(to, user);
  if (doctorGuardResult !== true) return doctorGuardResult;

  return true;
});
