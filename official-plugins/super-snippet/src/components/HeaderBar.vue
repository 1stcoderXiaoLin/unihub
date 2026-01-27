<script setup lang="ts">
import { Search, Plus, Settings } from 'lucide-vue-next'

const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  create: []
  settings: []
}>()
</script>

<template>
  <header class="h-14 border-b border-border flex items-center px-4 gap-4 bg-card shrink-0">
    <!-- 标题 -->
    <div class="flex items-center gap-2">
      <span class="text-xl">⚡</span>
      <h1 class="text-lg font-semibold">超级文本片段</h1>
    </div>
    
    <!-- 搜索框 -->
    <div class="flex-1 max-w-md">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="search"
          type="text"
          placeholder="输入搜索关键字进行模糊搜索文本片段"
          class="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <!-- 添加按钮 -->
      <button
        @click="emit('create')"
        class="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus class="w-4 h-4" />
        新建片段
      </button>
      
      <!-- 设置按钮 -->
      <button
        @click="emit('settings')"
        class="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
        title="设置"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
