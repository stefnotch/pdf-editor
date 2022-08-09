<script setup lang="ts">
import { useDocumentSessionStore, type Page } from "@/stores/document-sessions";
import { useElementSize, useVirtualList } from "@vueuse/core";
import PdfPage from "./PdfPage.vue";

const documentSessionStore = useDocumentSessionStore();
const pageGroups = computed(() => documentSessionStore.session.groups);

const pagesViewElement = ref<HTMLElement | null>(null);
const pagesViewSize = useElementSize(pagesViewElement);

interface Vector2 {
  x: number;
  y: number;
}

const pageBounds = ref<Vector2>({
  x: 120,
  y: 120,
});

interface RenderedDocument {
  name: string;
  rows: RenderedPageRow[];
}

interface RenderedPageRow {
  pages: Page[];
}

const renderedDocuments = computed(() => {
  const maximumPagesPerRow = Math.floor(pagesViewSize.width.value / pageBounds.value.x);
  const documents: RenderedDocument[] = pageGroups.value.map((group) => {
    const doc: RenderedDocument = {
      name: group.name,
      rows: [],
    };
    for (let i = 0; i < group.pages.length; i += maximumPagesPerRow) {
      const row: RenderedPageRow = {
        pages: group.pages.slice(i, i + maximumPagesPerRow),
      };
      doc.rows.push(row);
    }
    return doc;
  });
  return documents;
});

const documentHeaderHeight = ref(20);

const {
  list: virtualRenderedDocuments,
  containerProps,
  wrapperProps,
} = useVirtualList(renderedDocuments, {
  itemHeight: (index) => renderedDocuments.value[index].rows.length * pageBounds.value.y + documentHeaderHeight.value,
  overscan: 1,
});

/**
 * # Virtual List VS Resize Observer
 * Virtual List:
 * - https://vueuse.org/core/useVirtualList/
 * - Scales rather nicely to the case where the screen is rather small and the PDF has a ton of pages.
 * - We always see all pages in one row, so a virtual list would do the job rather well.
 *
 * Resize Observer:
 * - We need to write it ourselves, since the Vueuse library only supports having one observer per element. (Inefficient)
 */

// TODO: when rendering, make sure that it looks good on
// - high DPI displays
// - at any zoom level (and doesn't mess up when reloading while zoomed in/out)
// - when Windows is set to a custom scale level
// See:
// https://github.com/mozilla/pdf.js/issues/10679#issuecomment-867541293
// https://github.com/mozilla/pdf.js/issues/10509
// https://github.com/mozilla/pdf.js/issues/7630
// https://vueuse.org/core/useDevicePixelRatio/

// TODO: When resizing/zooming, make sure that the *same* pages remain visible.
</script>
<template>
  <div ref="pagesViewElement" class="grow">
    <div v-bind="containerProps" style="height: 100%; overflow-y: scroll" class="border-box">
      <div style="height: 2000px"></div>

      <div v-bind="wrapperProps">
        <div v-for="documentItem in virtualRenderedDocuments" :key="documentItem.index" class="pdf-document">
          <div :style="{ height: documentHeaderHeight + 'px' }">{{ documentItem.data.name }}</div>
          <!-- TODO: Be lazy and use https://vueuse.org/core/useVirtualList/ for only rendering some pages-->
          <div v-for="(row, index) in documentItem.data.rows" :key="index" class="pdf-page-row">
            <div v-for="(page, index) in row.pages" :key="index" class="pdf-page">
              <PdfPage :page="page" :bounds="pageBounds"></PdfPage>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.pdf-page-row {
  display: flex;
  flex-direction: row;
  height: calc(v-bind("pageBounds.y") * 1px);
}
.pdf-page {
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: calc(v-bind("pageBounds.x") * 1px);
  width: calc(v-bind("pageBounds.x") * 1px);
  height: calc(v-bind("pageBounds.y") * 1px);
}
</style>
