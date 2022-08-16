<script setup lang="ts">
import { useDocumentSessionStore } from "@/stores/document-sessions";
import type { UploadFileInfo } from "naive-ui";
const documentSessionStore = useDocumentSessionStore();

function download() {
  documentSessionStore.download();
}
function fileUploaded(data: { fileList: UploadFileInfo[] }) {
  documentSessionStore.addFiles(
    data.fileList.flatMap((f) => (f.file ? [f.file] : []))
  );
}
</script>

<template>
  <div class="border-b-1 flex flex-row p-t-1 p-x-2">
    <n-upload
      :default-upload="false"
      accept="application/pdf"
      :file-list="[]"
      multiple
      @change="fileUploaded"
    >
      <n-button>Select PDFs</n-button>
    </n-upload>
    <n-button type="primary" @click="download">
      Download
      <!--TODO: Put document name here, and give the button a max-width/a fixed width-->
      <!--TODO: Put "merged"/"individual" dropdown next to button-->
    </n-button>
  </div>
</template>
