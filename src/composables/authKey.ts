import type {InjectionKey} from "vue";
import {useAuth} from "./useAuth";

export const authKey: InjectionKey<ReturnType<typeof useAuth>> = Symbol('Auth key for auth identification')