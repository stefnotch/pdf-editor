<template>
  <h1>Hello world!</h1>
  {{ x }}
  <n-button type="primary" @click="onClick"> Click me to hear something nice </n-button>
</template>

<script lang="ts" setup>
const x = ref("test");
function onClick() {
  alert("You smell funny!");
}
</script>
