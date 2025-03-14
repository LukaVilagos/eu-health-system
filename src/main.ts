import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from "primevue/config";
import Aura from '@primeuix/themes/aura'
import {index} from "./router";
import { VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App);
app.use(index);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkMode: false,
        }
    }
});
app.use(VueQueryPlugin)
app.mount("#app");