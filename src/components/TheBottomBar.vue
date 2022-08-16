<script setup lang="ts">
import { version, homepage } from "../../package.json";
</script>

<template>
  <div class="border-t-1 flex flex-row p-b-1 p-x-2">
    <span>PDF Editor v{{ version }}</span>
    <span class="m-l-auto">
      <a :href="homepage" target="_blank">GitHub</a>
    </span>
  </div>
</template>
