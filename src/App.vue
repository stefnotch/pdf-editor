<template>
  <div class="container" ref="dropZoneRef">
    <TheNavBar></TheNavBar>
    <div class="content">
      <PdfEditor></PdfEditor>

      <n-upload :default-upload="false" accept="application/pdf" :file-list="[]" multiple directory-dnd @change="fileUploaded">
        <n-button>Select Document</n-button>
      </n-upload>
    </div>

    <!--Overlay elements should be the final elements-->
    <TheFileUploadOverlay class="dropzone" v-if="isOverDropZone"></TheFileUploadOverlay>
  </div>
</template>

<script lang="ts" setup>
import PdfEditor from "./components/PdfEditor.vue";
import TheFileUploadOverlay from "./components/TheFileUploadOverlay.vue";
import { useDropZone } from "@vueuse/core";
import { useDocumentSessionStore } from "./stores/document-sessions";
import TheNavBar from "./components/TheNavBar.vue";
import { useUrlRef } from "./composables/url-ref";
import type { UploadFileInfo } from "naive-ui";

const { urlRef } = useUrlRef();

const sessionId = urlRef("session-id", "");

const documentSessionStore = useDocumentSessionStore();

const dropZoneRef = ref<HTMLDivElement>();

function onDrop(files: File[] | null) {
  console.log(files);
}

function fileUploaded(data: { fileList: UploadFileInfo[] }) {
  console.log(data);
}

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop);
</script>
<style scoped>
.container {
  position: absolute;
  height: 100vh;
  width: 100vw;
}
</style>
