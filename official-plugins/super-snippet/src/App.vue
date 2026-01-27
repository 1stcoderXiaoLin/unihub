<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSnippetStore, useSnippetExecutor, useToast } from './composables'
import GroupList from './components/GroupList.vue'
import SnippetList from './components/SnippetList.vue'
import SnippetEditor from './components/SnippetEditor.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import HeaderBar from './components/HeaderBar.vue'
import Toast from './components/Toast.vue'
import type { Snippet } from './types'
import { RefreshCw } from 'lucide-vue-next'

const store = useSnippetStore()
const executor = useSnippetExecutor()
const toast = useToast()

// 编辑状态
const editingSnippet = ref<Snippet | null>(null)
const isCreating = ref(false)
const showSettings = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 搜索触发事件取消函数
let unsubscribeSearch: (() => void) | null = null

// 过滤后的片段列表
const filteredSnippets = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (!keyword) return store.currentSnippets.value
  
  return store.currentSnippets.value.filter(s => 
    s.description.toLowerCase().includes(keyword) ||
    s.keywords.some(k => k.toLowerCase().includes(keyword)) ||
    s.content.toLowerCase().includes(keyword)
  )
})

// 处理全局搜索触发
async function handleSearchTrigger(data: { itemId: string; data?: unknown }) {
  console.log('[超级文本片段] 收到搜索触发:', data)
  
  const snippetData = data.data as { snippetId: string } | undefined
  if (!snippetData?.snippetId) return
  
  const snippet = store.snippets.value.find(s => s.id === snippetData.snippetId)
  if (!snippet) {
    toast.error('片段不存在', '可能已被删除')
    return
  }
  
  // 执行片段
  const success = await executor.executeSnippet(snippet)
  if (success) {
    toast.success('执行成功', snippet.description || '文本已粘贴')
  } else {
    toast.error('执行失败', executor.lastError.value || '请检查权限设置')
  }
}

// 初始化
onMounted(async () => {
  await store.loadData()
  
  // 监听全局搜索触发事件
  if (window.unihub?.search?.onTrigger) {
    unsubscribeSearch = window.unihub.search.onTrigger(handleSearchTrigger)
  }
})

// 清理
onUnmounted(() => {
  if (unsubscribeSearch) {
    unsubscribeSearch()
  }
})

// 创建新片段
function handleCreate() {
  isCreating.value = true
  editingSnippet.value = null
}

// 编辑片段
function handleEdit(snippet: Snippet) {
  isCreating.value = false
  editingSnippet.value = { ...snippet }
}

// 保存片段
function handleSave(data: Partial<Snippet>) {
  if (isCreating.value) {
    store.createSnippet(data)
    toast.success('创建成功', '文本片段已创建')
  } else if (editingSnippet.value) {
    store.updateSnippet(editingSnippet.value.id, data)
    toast.success('保存成功', '文本片段已更新')
  }
  closeEditor()
}

// 关闭编辑器
function closeEditor() {
  editingSnippet.value = null
  isCreating.value = false
}

// 执行片段
async function handleExecute(snippet: Snippet) {
  const success = await executor.executeSnippet(snippet)
  if (success) {
    toast.success('执行成功', snippet.description || '文本已粘贴')
  } else {
    toast.error('执行失败', executor.lastError.value || '请检查权限设置')
  }
}

// 切换分组
function handleGroupChange(groupId: string) {
  store.currentGroupId.value = groupId
}

// 切换片段状态
function handleToggle(id: string) {
  store.toggleSnippet(id)
  const snippet = store.snippets.value.find(s => s.id === id)
  if (snippet) {
    toast.info(snippet.enabled ? '已启用' : '已禁用', snippet.description || '文本片段')
  }
}

// 删除片段
function handleDelete(id: string) {
  const snippet = store.snippets.value.find(s => s.id === id)
  store.deleteSnippet(id)
  toast.success('删除成功', snippet?.description || '文本片段已删除')
}

// 添加分组
function handleAddGroup(name: string, icon?: string) {
  store.addGroup(name, icon)
  toast.success('分组已创建', name)
}

// 删除分组
function handleDeleteGroup(id: string) {
  const group = store.groups.value.find(g => g.id === id)
  store.deleteGroup(id)
  toast.success('分组已删除', group?.name || '')
}
</script>

<template>
  <div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">
    <!-- 顶部标题栏 -->
    <HeaderBar
      v-model:search="searchKeyword"
      @create="handleCreate"
      @settings="showSettings = true"
    />
    
    <!-- 主内容区 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧分组列表 -->
      <GroupList
        :groups="store.groups.value"
        :current-group-id="store.currentGroupId.value"
        :get-count="store.getGroupSnippetCount"
        @select="handleGroupChange"
        @add="handleAddGroup"
        @update="store.updateGroup"
        @delete="handleDeleteGroup"
      />
      
      <!-- 右侧片段列表 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <SnippetList
          :snippets="filteredSnippets"
          :loading="store.isLoading.value"
          @edit="handleEdit"
          @toggle="handleToggle"
          @delete="handleDelete"
          @execute="handleExecute"
        />
      </div>
    </div>
    
    <!-- 片段编辑器 (侧边栏/模态框) -->
    <Transition name="slide-fade">
      <SnippetEditor
        v-if="editingSnippet || isCreating"
        :snippet="editingSnippet"
        :is-creating="isCreating"
        :groups="store.groups.value"
        :current-group-id="store.currentGroupId.value"
        @save="handleSave"
        @cancel="closeEditor"
      />
    </Transition>
    
    <!-- 设置面板 -->
    <Transition name="fade">
      <SettingsPanel
        v-if="showSettings"
        :settings="store.settings.value"
        @update="store.updateSettings"
        @close="showSettings = false"
        @export="store.exportData"
        @import="store.importData"
      />
    </Transition>
    
    <!-- Toast 通知 -->
    <Toast
      :messages="toast.messages.value"
      @dismiss="toast.dismiss"
    />
    
    <!-- 加载中 -->
    <Transition name="fade">
      <div
        v-if="store.isLoading.value"
        class="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
      >
        <RefreshCw class="w-8 h-8 animate-spin text-primary" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑入淡出 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
