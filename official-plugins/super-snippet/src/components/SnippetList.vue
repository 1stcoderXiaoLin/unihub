<script setup lang="ts">
import type { Snippet } from '@/types'
import { Play, Pencil, Trash2, Copy } from 'lucide-vue-next'

const props = defineProps<{
  snippets: Snippet[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [snippet: Snippet]
  toggle: [id: string]
  delete: [id: string]
  execute: [snippet: Snippet]
}>()

// 截断文本显示
function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 确认删除
function confirmDelete(snippet: Snippet) {
  if (confirm(`确定要删除片段"${snippet.description || '未命名'}"吗？`)) {
    emit('delete', snippet.id)
  }
}

// 复制到剪贴板
async function copyToClipboard(snippet: Snippet) {
  try {
    await window.unihub.clipboard.writeText(snippet.content)
    await window.unihub.notification.show({
      title: '已复制',
      body: snippet.description || '文本片段已复制到剪贴板'
    })
  } catch (error) {
    console.error('复制失败:', error)
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- 表头 -->
    <div class="h-12 px-4 flex items-center gap-4 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground shrink-0">
      <div class="flex-1 min-w-[200px]">片段说明</div>
      <div class="w-16 text-center">状态</div>
      <div class="w-32">关键字</div>
      <div class="flex-1 min-w-[200px]">文本片段</div>
      <div class="w-28 text-center">操作</div>
    </div>
    
    <!-- 片段列表 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 空状态 -->
      <div
        v-if="!loading && snippets.length === 0"
        class="h-full flex flex-col items-center justify-center text-muted-foreground"
      >
        <div class="text-6xl mb-4">📝</div>
        <div class="text-lg mb-2">暂无文本片段</div>
        <div class="text-sm">点击右上角"新建片段"创建第一个文本片段</div>
      </div>
      
      <!-- 片段行 -->
      <div
        v-for="snippet in snippets"
        :key="snippet.id"
        class="h-14 px-4 flex items-center gap-4 border-b border-border table-row-hover"
      >
        <!-- 说明 -->
        <div class="flex-1 min-w-[200px] truncate text-sm">
          {{ snippet.description || '未命名片段' }}
        </div>
        
        <!-- 状态开关 -->
        <div class="w-16 flex justify-center">
          <button
            @click="emit('toggle', snippet.id)"
            class="toggle-switch"
            :class="{ 'active': snippet.enabled }"
            :title="snippet.enabled ? '点击禁用' : '点击启用'"
          />
        </div>
        
        <!-- 关键字 -->
        <div class="w-32 flex gap-1 flex-wrap">
          <span
            v-for="keyword in snippet.keywords.slice(0, 2)"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </span>
          <span
            v-if="snippet.keywords.length > 2"
            class="text-xs text-muted-foreground"
          >
            +{{ snippet.keywords.length - 2 }}
          </span>
        </div>
        
        <!-- 文本预览 -->
        <div class="flex-1 min-w-[200px] truncate text-sm text-muted-foreground font-mono">
          {{ truncate(snippet.content, 60) }}
        </div>
        
        <!-- 操作按钮 -->
        <div class="w-28 flex items-center justify-center gap-1">
          <!-- 执行 -->
          <button
            @click="emit('execute', snippet)"
            class="w-8 h-8 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
            title="执行粘贴"
          >
            <Play class="w-4 h-4" />
          </button>
          
          <!-- 复制 -->
          <button
            @click="copyToClipboard(snippet)"
            class="w-8 h-8 rounded flex items-center justify-center hover:bg-accent transition-colors"
            title="复制到剪贴板"
          >
            <Copy class="w-4 h-4" />
          </button>
          
          <!-- 编辑 -->
          <button
            @click="emit('edit', snippet)"
            class="w-8 h-8 rounded flex items-center justify-center hover:bg-accent transition-colors"
            title="编辑"
          >
            <Pencil class="w-4 h-4" />
          </button>
          
          <!-- 删除 -->
          <button
            @click="confirmDelete(snippet)"
            class="w-8 h-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
            title="删除"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
