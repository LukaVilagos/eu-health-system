import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import { router } from "./router";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { Ripple } from "primevue";

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
  Ripple,
});
app.use(VueQueryPlugin);
app.mount("#app");
