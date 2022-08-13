// external imports
import { createApp } from "vue";

// internal imports
import { createPinia } from "pinia";
import App from "./App.vue";

// styling
import "./main.css";
import "uno.css";

// pdf.js
import * as pdfjs from "pdfjs-dist";

// TODO: Get rid of this disgusting hack once Firefox gets worker modules support.
// https://bugzilla.mozilla.org/show_bug.cgi?id=1247687
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js?worker&url";
pdfjs.GlobalWorkerOptions.workerPort = new Worker(PdfjsWorker.replace(/type=module/, ""), {
  type: "classic",
});
/* The good approach:
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js?worker";
pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker();
 */

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
