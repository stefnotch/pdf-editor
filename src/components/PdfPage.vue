<script setup lang="ts">
import {
  useDocumentSessionStore,
  type Page,
  pixelRatio,
} from "@/stores/document-sessions";

const props = defineProps<{
  page: Page;
  bounds: {
    x: number;
    y: number;
  };
}>();

// TODO: Faster rendering using https://github.com/mozilla/pdf.js/issues/10319
// Relevant Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=1390089

const pageCanvas = ref<HTMLCanvasElement | null>(null);

const documentSessionStore = useDocumentSessionStore();

const pageToRender = computed(() =>
  documentSessionStore.getRenderedPage(props.page.page)
);

let cancelRenderTask: () => Promise<void> = () => Promise.resolve();
watch(
  [pageCanvas, pageToRender, () => props.bounds, pixelRatio],
  ([canvas, page]) => {
    // TODO: Have a proper queue and don't immediately start rendering (especially when zooming)
    cancelRenderTask();

    if (canvas && page) {
      const context = canvas.getContext("2d");
      if (context) {
        const baseViewport = page.getViewport({ scale: 1 });
        const scaledViewport = baseViewport.clone({
          scale: Math.min(
            props.bounds.x / baseViewport.width,
            props.bounds.y / baseViewport.height
          ),
        });
        // Make sure to use the "actual" pixel sizes
        const screenScaledViewport = scaledViewport.clone({
          scale: pixelRatio.value,
        });
        canvas.width = screenScaledViewport.width;
        canvas.height = screenScaledViewport.height;
        // And then scale the canvas down to the CSS pixel sizes
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        const renderTask = page.render({
          canvasContext: context,
          viewport: screenScaledViewport,
        });
        const renderTaskPromise = renderTask.promise.catch((error) => {
          if (error.name === "RenderingCancelledException") {
            return;
          } else {
            throw error;
          }
        });

        cancelRenderTask = async () => {
          renderTask.cancel();
          await renderTaskPromise;
        };
      }
    }
  }
);
</script>
<template>
  <!-- TODO: Only render the page when this element is visible -->
  <div class="relative h-full w-full page" tabindex="0">
    <canvas ref="pageCanvas"></canvas>
    <div class="absolute bottom-0 bg-slate-400 right-0 left-0">
      page {{ page.page.pageIndex + 1 }}
    </div>
  </div>
</template>
<style scoped>
.page:focus {
  outline: 2px solid black;
}
</style>
