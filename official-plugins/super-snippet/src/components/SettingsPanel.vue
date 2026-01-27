<script setup lang="ts">
import type { PluginSettings } from '@/types'
import { X, Download, Upload, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  settings: PluginSettings
}>()

const emit = defineEmits<{
  update: [updates: Partial<PluginSettings>]
  close: []
  export: []
  import: [json: string]
}>()

// 导出数据
async function handleExport() {
  try {
    // 触发导出
    emit('export')
    
    await window.unihub.notification.show({
      title: '导出成功',
      body: '数据已导出'
    })
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 导入数据
async function handleImport() {
  try {
    const filePath = await window.unihub.fs.selectFile()
    if (!filePath) return
    
    const content = await window.unihub.fs.readFile(filePath)
    if (!content) {
      alert('读取文件失败')
      return
    }
    
    emit('import', content)
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 清空所有数据
async function handleClear() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    try {
      await window.unihub.db.clear()
      window.location.reload()
    } catch (error) {
      console.error('清空失败:', error)
    }
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- 遮罩 -->
    <div
      class="absolute inset-0 bg-black/50"
      @click="emit('close')"
    />
    
    <!-- 设置面板 -->
    <div class="relative w-[500px] max-h-[80vh] bg-card rounded-xl shadow-xl flex flex-col overflow-hidden">
      <!-- 标题栏 -->
      <div class="h-14 px-6 flex items-center justify-between border-b border-border shrink-0">
        <h2 class="text-lg font-semibold">设置</h2>
        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- 设置内容 -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- 默认粘贴方式 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">默认粘贴方式</label>
          <select
            :value="settings.defaultPasteMethod"
            @change="emit('update', { defaultPasteMethod: ($event.target as HTMLSelectElement).value as any })"
            class="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="shortcut">模拟快捷键</option>
            <option value="keyboard">键盘输入</option>
            <option value="terminal">终端执行</option>
          </select>
        </div>
        
        <!-- 默认后置动作 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">默认后置动作</label>
          <select
            :value="settings.defaultPostAction"
            @change="emit('update', { defaultPostAction: ($event.target as HTMLSelectElement).value as any })"
            class="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="restore">还原剪贴板内容</option>
            <option value="keep">保留剪贴板内容</option>
            <option value="copy-only">仅复制文本片段</option>
            <option value="enter">按下回车键</option>
          </select>
        </div>
        
        <!-- 全局搜索集成 -->
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium">全局搜索集成</label>
            <p class="text-xs text-muted-foreground mt-1">
              在 UniHub 全局搜索中显示文本片段
            </p>
          </div>
          <button
            @click="emit('update', { searchEnabled: !settings.searchEnabled })"
            class="toggle-switch"
            :class="{ 'active': settings.searchEnabled }"
          />
        </div>
        
        <hr class="border-border" />
        
        <!-- 数据管理 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">数据管理</h3>
          
          <div class="flex gap-3">
            <button
              @click="handleExport"
              class="flex-1 h-10 rounded-lg border border-border flex items-center justify-center gap-2 text-sm hover:bg-accent transition-colors"
            >
              <Download class="w-4 h-4" />
              导出数据
            </button>
            
            <button
              @click="handleImport"
              class="flex-1 h-10 rounded-lg border border-border flex items-center justify-center gap-2 text-sm hover:bg-accent transition-colors"
            >
              <Upload class="w-4 h-4" />
              导入数据
            </button>
          </div>
          
          <button
            @click="handleClear"
            class="w-full h-10 rounded-lg border border-destructive text-destructive flex items-center justify-center gap-2 text-sm hover:bg-destructive/10 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            清空所有数据
          </button>
        </div>
      </div>
      
      <!-- 底部 -->
      <div class="h-14 px-6 flex items-center justify-end border-t border-border shrink-0">
        <button
          @click="emit('close')"
          class="h-9 px-6 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>
