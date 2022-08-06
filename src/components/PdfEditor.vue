<template>
  <div>
    PDF Document Name {{ documentSessionStore.documentName }}

    <div v-for="(group, index) in pageGroups" :key="index">
      {{ group.name }}
      <!-- TODO: Be lazy and use https://vueuse.org/core/useVirtualList/ for only rendering some pages-->
      <PdfPage v-for="(page, index) in group.pages" :key="index" :page="page"></PdfPage>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore } from "@/stores/document-sessions.js";
import PdfPage from "./PdfPage.vue";

const documentSessionStore = useDocumentSessionStore();

const pageGroups = computed(() => documentSessionStore.session.groups);

const pageBounds = ref<{
  x: number;
  y: number;
}>({
  x: 80,
  y: 120,
});

// TODO: when rendering, make sure that it looks good on
// - high DPI displays
// - at any zoom level (and doesn't mess up when reloading while zoomed in/out)
// - when Windows is set to a custom scale level
// See:
// https://github.com/mozilla/pdf.js/issues/10679#issuecomment-867541293
// https://github.com/mozilla/pdf.js/issues/10509
// https://github.com/mozilla/pdf.js/issues/7630
// https://vueuse.org/core/useDevicePixelRatio/
</script>
