<template>
  <!-- TODO: Render the page -->
  <!-- TODO: Only render the page when this element is visible -->
  <div class="relative h-full w-full">
    <canvas ref="pageCanvas"></canvas>
    <div class="absolute bottom-0 bg-slate-400 right-0 left-0">page {{ page.pageIndex + 1 }}</div>
  </div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore, type Page } from "@/stores/document-sessions";

const props = defineProps<{
  page: Page;
  bounds: {
    x: number;
    y: number;
  };
}>();

const pageCanvas = ref<HTMLCanvasElement | null>(null);

const documentSessionStore = useDocumentSessionStore();

const pageToRender = computed(() => documentSessionStore.getRenderedPage(props.page));

watch([pageCanvas, pageToRender], ([canvas, page]) => {
  if (canvas && page) {
    const context = canvas.getContext("2d");
    if (context) {
      const baseViewport = page.getViewport({ scale: 1 });
      const scaledViewport = baseViewport.clone({
        scale: Math.min(props.bounds.x / baseViewport.width, props.bounds.y / baseViewport.height),
      });
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      page.render({
        canvasContext: context,
        viewport: scaledViewport,
      });
    }
  }
});
</script>
