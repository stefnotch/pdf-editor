<template>
  <n-upload :default-upload="false" accept="application/pdf" :file-list="[]" multiple directory-dnd @change="fileUploaded">
    <n-upload-dragger>
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <!--TODO: Put icon here-->
          Upload
        </n-icon>
      </div>
      <n-text style="font-size: 16px"> Click or drag a PDF to this area to upload </n-text>
    </n-upload-dragger>
  </n-upload>
</template>
<script setup lang="ts">
import type { UploadFileInfo } from "naive-ui";

function fileUploaded(data: { fileList: UploadFileInfo[] }) {
  console.log(data);
}
</script>
