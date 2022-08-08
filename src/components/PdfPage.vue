<template>
  <!-- TODO: Render the page -->
  <!-- TODO: Only render the page when this element is visible -->
  <div>page {{ page.pageIndex + 1 }}</div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore, type Page } from "@/stores/document-sessions";

const props = defineProps<{
  page: Page;
}>();

const documentSessionStore = useDocumentSessionStore();

const pageToRender = computed(() => documentSessionStore.getRenderedPage(props.page));
</script>
