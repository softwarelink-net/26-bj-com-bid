<template>
  <div class="app-root">
    <GlobalStickyBanner />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import GlobalStickyBanner from '@/components/common/GlobalStickyBanner.vue'
</script>

<style scoped>
.app-root {
  min-height: calc(100vh - 40px);
}
</style>
