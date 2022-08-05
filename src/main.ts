// external imports
import { createApp } from "vue";

// internal imports
import { createPinia } from "pinia";
import App from "./App.vue";

// styling
import "./styling/base.css";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
