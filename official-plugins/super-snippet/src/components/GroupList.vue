<script setup lang="ts">
import { ref } from 'vue'
import type { SnippetGroup } from '@/types'
import { FolderOpen, Plus, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  groups: SnippetGroup[]
  currentGroupId: string | null
  getCount: (groupId: string) => number
}>()

const emit = defineEmits<{
  select: [groupId: string]
  add: [name: string, icon?: string]
  update: [id: string, updates: Partial<SnippetGroup>]
  delete: [id: string]
}>()

// 新建分组状态
const isAdding = ref(false)
const newGroupName = ref('')

// 编辑分组状态
const editingId = ref<string | null>(null)
const editingName = ref('')

// 右键菜单状态
const contextMenuId = ref<string | null>(null)

// 开始添加分组
function startAdd() {
  isAdding.value = true
  newGroupName.value = ''
}

// 确认添加
function confirmAdd() {
  if (newGroupName.value.trim()) {
    emit('add', newGroupName.value.trim())
  }
  isAdding.value = false
  newGroupName.value = ''
}

// 取消添加
function cancelAdd() {
  isAdding.value = false
  newGroupName.value = ''
}

// 开始编辑
function startEdit(group: SnippetGroup) {
  editingId.value = group.id
  editingName.value = group.name
  contextMenuId.value = null
}

// 确认编辑
function confirmEdit() {
  if (editingId.value && editingName.value.trim()) {
    emit('update', editingId.value, { name: editingName.value.trim() })
  }
  editingId.value = null
  editingName.value = ''
}

// 取消编辑
function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

// 删除分组
function handleDelete(id: string) {
  if (id === 'default') {
    return
  }
  if (confirm('确定要删除此分组吗？分组内的片段将移至默认分组。')) {
    emit('delete', id)
  }
  contextMenuId.value = null
}

// 切换右键菜单
function toggleContextMenu(id: string, event: Event) {
  event.stopPropagation()
  contextMenuId.value = contextMenuId.value === id ? null : id
}

// 点击外部关闭菜单
function closeContextMenu() {
  contextMenuId.value = null
}
</script>

<template>
  <aside
    class="w-56 border-r border-border bg-card flex flex-col shrink-0"
    @click="closeContextMenu"
  >
    <!-- 分组标题 -->
    <div class="h-12 px-4 flex items-center justify-between border-b border-border">
      <span class="text-sm font-medium text-muted-foreground">分组列表</span>
      <button
        @click.stop="startAdd"
        class="w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-colors"
        title="新建分组"
      >
        <RefreshCw v-if="false" class="w-4 h-4 animate-spin" />
        <Plus v-else class="w-4 h-4" />
      </button>
    </div>
    
    <!-- 分组列表 -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <!-- 新建分组输入框 -->
      <div v-if="isAdding" class="p-2 rounded-lg bg-accent">
        <input
          v-model="newGroupName"
          type="text"
          placeholder="输入分组名称"
          class="w-full h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autofocus
          @keyup.enter="confirmAdd"
          @keyup.escape="cancelAdd"
          @blur="confirmAdd"
        />
      </div>
      
      <!-- 分组项 -->
      <div
        v-for="group in groups"
        :key="group.id"
        class="relative group"
      >
        <!-- 编辑状态 -->
        <div v-if="editingId === group.id" class="p-2 rounded-lg bg-accent">
          <input
            v-model="editingName"
            type="text"
            class="w-full h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autofocus
            @keyup.enter="confirmEdit"
            @keyup.escape="cancelEdit"
            @blur="confirmEdit"
          />
        </div>
        
        <!-- 正常状态 -->
        <div
          v-else
          class="group-item flex items-center justify-between"
          :class="{ 'active': currentGroupId === group.id }"
          @click="emit('select', group.id)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <FolderOpen class="w-4 h-4 shrink-0" />
            <span class="truncate text-sm">{{ group.name }}</span>
          </div>
          
          <div class="flex items-center gap-1">
            <span class="text-xs text-muted-foreground">{{ getCount(group.id) }}</span>
            
            <!-- 更多操作 -->
            <button
              v-if="group.id !== 'default'"
              @click.stop="toggleContextMenu(group.id, $event)"
              class="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-background/50 transition-all"
            >
              <MoreHorizontal class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- 右键菜单 -->
        <div
          v-if="contextMenuId === group.id"
          class="absolute right-0 top-full mt-1 z-10 w-32 py-1 bg-popover border border-border rounded-lg shadow-lg"
        >
          <button
            @click.stop="startEdit(group)"
            class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <Pencil class="w-4 h-4" />
            重命名
          </button>
          <button
            @click.stop="handleDelete(group.id)"
            class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-destructive hover:bg-accent transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            删除
          </button>
        </div>
      </div>
    </div>
    
    <!-- 底部操作 -->
    <div class="p-2 border-t border-border">
      <button
        @click="startAdd"
        class="w-full h-9 rounded-lg border border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Plus class="w-4 h-4" />
        新建分组
      </button>
    </div>
  </aside>
</template>
