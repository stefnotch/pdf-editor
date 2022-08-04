import { defineStore, acceptHMRUpdate } from "pinia";

export const useCounterStore = defineStore("counter-store", () => {
  const counter = ref(0);
  const doubleCount = computed(() => counter.value * 2);

  function increment() {
    counter.value++;
  }

  return {
    doubleCount,
    increment,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot));
}
