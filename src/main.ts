import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {getFirebase} from "./firebase/app.ts";
import {VueFire, VueFireAuth} from "vuefire";
import PrimeVue from "primevue/config";
import Aura from '@primeuix/themes/aura'
import {router} from "./router.ts";

const {firebaseApp} = getFirebase()

const app = createApp(App);
app.use(router);
app.use(VueFire, {
    firebaseApp,
    modules: [
        VueFireAuth()
    ]
});
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.mount("#app");