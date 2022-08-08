<template>
  <!-- TODO: Render the page -->
  <!-- TODO: Only render the page when this element is visible -->
  <div>
    page {{ page.pageIndex + 1 }}
    <canvas ref="pageCanvas"></canvas>
  </div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore, type Page } from "@/stores/document-sessions";

const props = defineProps<{
  page: Page;
}>();

const pageCanvas = ref<HTMLCanvasElement | null>(null);

const documentSessionStore = useDocumentSessionStore();

const pageToRender = computed(() => documentSessionStore.getRenderedPage(props.page));

watch([pageCanvas, pageToRender], ([canvas, page]) => {
  if (canvas && page) {
    const context = canvas.getContext("2d");
    if (context) {
      const baseViewport = page.getViewport({ scale: 1 });
      const scaledViewport = baseViewport.clone({ scale: 1 }); // TODO: Scale the viewport (shrink to fit)
      canvas.height = scaledViewport.width;
      canvas.width = scaledViewport.height;
      page.render({
        canvasContext: context,
        viewport: scaledViewport,
      });
    }
  }
});
</script>
