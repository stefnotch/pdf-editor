<template>
  <h1>Hello world!</h1>
  <n-button type="primary" @click="onClick"> Click me to hear something nice </n-button>
</template>

<script lang="ts" setup>
function onClick() {
  alert("You smell funny!");
}
</script>
