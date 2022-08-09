<script lang="ts" setup>
import PdfEditor from "./components/PdfEditor.vue";
import TheFileUploadOverlay from "./components/TheFileUploadOverlay.vue";
import { useDropZone } from "@vueuse/core";
import { useDocumentSessionStore } from "./stores/document-sessions";
import TheNavBar from "./components/TheNavBar.vue";
import type { UploadFileInfo } from "naive-ui";

const documentSessionStore = useDocumentSessionStore();

const dropZoneRef = ref<HTMLDivElement>();

// TODO: Loading indicator
// TODO: Complain if the document isn't really a PDF

function onDrop(files: File[] | null) {
  if (files) {
    documentSessionStore.addFiles(files);
  }
}

function fileUploaded(data: { fileList: UploadFileInfo[] }) {
  documentSessionStore.addFiles(data.fileList.flatMap((f) => (f.file ? [f.file] : [])));
}

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop);
</script>

<template>
  <div class="absolute h-full w-full flex flex-col" ref="dropZoneRef">
    <TheNavBar></TheNavBar>
    <div class="overflow-y-scroll grow">
      <PdfEditor></PdfEditor>

      <n-upload :default-upload="false" accept="application/pdf" :file-list="[]" multiple directory-dnd @change="fileUploaded">
        <n-button>Select or drag PDF documents</n-button>
      </n-upload>
    </div>

    <!--Overlay elements should be the final elements-->
    <TheFileUploadOverlay class="dropzone" v-if="isOverDropZone"></TheFileUploadOverlay>
  </div>
</template>
