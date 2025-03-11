import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from "primevue/config";
import Aura from '@primeuix/themes/aura'
import {router} from "./router.ts";
import {VueFire, VueFireAuth} from "vuefire";
import {getFirebaseApp} from "./firebase/app.ts";

const { firebaseApp } = getFirebaseApp;

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(VueFire, {
    firebaseApp,
    modules: [
        VueFireAuth()
    ]
});
app.mount("#app");