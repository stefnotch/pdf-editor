<template>
  <n-upload :default-upload="false" accept="application/pdf" :file-list="[]" multiple directory-dnd @change="fileUploaded">
    <n-button>Select Document</n-button>
  </n-upload>
</template>
<script setup lang="ts">
import type { UploadFileInfo } from "naive-ui";

function fileUploaded(data: { fileList: UploadFileInfo[] }) {
  console.log(data);
}
</script>
