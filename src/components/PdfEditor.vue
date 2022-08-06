<template>
  <div>PDF Document Name {{ documentSessionStore.documentName }}</div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore } from "@/stores/document-sessions.js";

const documentSessionStore = useDocumentSessionStore();

// TODO: when rendering, make sure that it looks good on
// - high DPI displays
// - at any zoom level (and doesn't mess up when reloading while zoomed in/out)
// - when Windows is set to a custom scale level
// See:
// https://github.com/mozilla/pdf.js/issues/10679#issuecomment-867541293
// https://github.com/mozilla/pdf.js/issues/10509
// https://github.com/mozilla/pdf.js/issues/7630
</script>
