import { ref, computed } from 'vue'
import type { Snippet, SnippetGroup, PluginSettings, StorageData } from '@/types'
import { DEFAULT_SETTINGS, DEFAULT_GROUP } from '@/types'

// 生成唯一 ID
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 12)
}

// 存储 key
const STORAGE_KEY = 'super-snippet-data'

// 响应式状态
const groups = ref<SnippetGroup[]>([])
const snippets = ref<Snippet[]>([])
const settings = ref<PluginSettings>(DEFAULT_SETTINGS)
const isLoading = ref(true)
const currentGroupId = ref<string | null>(null)
const lastError = ref<string | null>(null)

/**
 * 加载数据
 */
async function loadData(): Promise<void> {
  try {
    isLoading.value = true
    lastError.value = null
    
    // 调试：检查 unihub API 是否可用
    if (!window.unihub || !window.unihub.db) {
      console.error('[超级文本片段] unihub.db API 不可用')
      lastError.value = 'unihub.db API 不可用'
      // 尝试从 localStorage 恢复
      const localData = localStorage.getItem(STORAGE_KEY)
      if (localData) {
        const data = JSON.parse(localData) as StorageData
        groups.value = data.groups || [DEFAULT_GROUP]
        snippets.value = data.snippets || []
        settings.value = { ...DEFAULT_SETTINGS, ...data.settings }
        console.log('[超级文本片段] 从 localStorage 恢复数据')
      } else {
        groups.value = [DEFAULT_GROUP]
        snippets.value = []
        settings.value = DEFAULT_SETTINGS
      }
      return
    }
    
    const data = await window.unihub.db.get(STORAGE_KEY) as StorageData | null
    console.log('[超级文本片段] 读取到数据:', data)
    
    if (data) {
      groups.value = data.groups || [DEFAULT_GROUP]
      snippets.value = data.snippets || []
      settings.value = { ...DEFAULT_SETTINGS, ...data.settings }
    } else {
      // 初始化默认数据
      groups.value = [DEFAULT_GROUP]
      snippets.value = []
      settings.value = DEFAULT_SETTINGS
      await saveData()
    }
    
    // 设置默认选中的分组
    if (groups.value.length > 0 && !currentGroupId.value) {
      currentGroupId.value = groups.value[0].id
    }
    
    console.log('[超级文本片段] 数据加载完成', {
      groups: groups.value.length,
      snippets: snippets.value.length
    })
    
    // 注册搜索项
    await registerSearchItems()
  } catch (error) {
    console.error('[超级文本片段] 加载数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 保存数据
 */
async function saveData(): Promise<void> {
  try {
    const data: StorageData = {
      groups: groups.value,
      snippets: snippets.value,
      settings: settings.value
    }
    
    // 同时保存到 localStorage 作为备份
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    
    // 保存到主应用存储
    if (window.unihub && window.unihub.db) {
      await window.unihub.db.set(STORAGE_KEY, data)
      console.log('[超级文本片段] 数据保存成功')
    } else {
      console.warn('[超级文本片段] unihub.db 不可用，仅保存到 localStorage')
    }
  } catch (error) {
    console.error('[超级文本片段] 保存数据失败:', error)
    // 确保至少保存到 localStorage
    try {
      const data: StorageData = {
        groups: groups.value,
        snippets: snippets.value,
        settings: settings.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('[超级文本片段] localStorage 保存也失败:', e)
    }
  }
  
  // 更新搜索项注册
  await registerSearchItems()
}

/**
 * 注册搜索项到全局搜索
 */
async function registerSearchItems(): Promise<void> {
  try {
    if (!window.unihub || !window.unihub.search) {
      console.warn('[超级文本片段] search API 不可用')
      return
    }
    
    // 只注册启用的片段，且有关键词的
    const searchItems = snippets.value
      .filter(s => s.enabled && s.keywords && s.keywords.length > 0)
      .map(s => ({
        id: s.id,
        title: s.description || s.keywords[0] || '未命名片段',
        subtitle: s.content.substring(0, 50) + (s.content.length > 50 ? '...' : ''),
        icon: 'fluent-emoji/high-voltage.svg',
        keywords: [...s.keywords], // 关键词
        data: { snippetId: s.id } // 附加数据，用于执行时定位
      }))
    
    // 先取消之前的注册
    await window.unihub.search.unregister()
    
    // 注册新的搜索项
    if (searchItems.length > 0) {
      await window.unihub.search.register(searchItems)
      console.log(`[超级文本片段] 注册 ${searchItems.length} 个搜索项`)
    }
  } catch (error) {
    console.error('[超级文本片段] 注册搜索项失败:', error)
  }
}

// ==================== 分组操作 ====================

/**
 * 添加分组
 */
function addGroup(name: string, icon?: string): SnippetGroup {
  const newGroup: SnippetGroup = {
    id: generateId(),
    name,
    icon,
    order: groups.value.length,
    createdAt: Date.now()
  }
  groups.value.push(newGroup)
  saveData()
  return newGroup
}

/**
 * 更新分组
 */
function updateGroup(id: string, updates: Partial<SnippetGroup>): void {
  const index = groups.value.findIndex(g => g.id === id)
  if (index !== -1) {
    groups.value[index] = { ...groups.value[index], ...updates }
    saveData()
  }
}

/**
 * 删除分组
 */
function deleteGroup(id: string): void {
  // 不能删除默认分组
  if (id === 'default') {
    console.warn('[超级文本片段] 不能删除默认分组')
    return
  }
  
  // 将该分组下的片段移动到默认分组
  snippets.value.forEach(s => {
    if (s.groupId === id) {
      s.groupId = 'default'
    }
  })
  
  groups.value = groups.value.filter(g => g.id !== id)
  
  // 如果删除的是当前选中的分组，切换到默认分组
  if (currentGroupId.value === id) {
    currentGroupId.value = 'default'
  }
  
  saveData()
}

// ==================== 片段操作 ====================

/**
 * 创建新片段
 */
function createSnippet(data: Partial<Snippet>): Snippet {
  const newSnippet: Snippet = {
    id: generateId(),
    groupId: data.groupId || currentGroupId.value || 'default',
    description: data.description || '',
    keywords: data.keywords || [],
    content: data.content || '',
    enabled: data.enabled ?? true,
    pasteMethod: data.pasteMethod || settings.value.defaultPasteMethod,
    postAction: data.postAction || settings.value.defaultPostAction,
    commandType: data.commandType || 'default',
    globalShortcut: data.globalShortcut,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0
  }
  snippets.value.push(newSnippet)
  saveData()
  return newSnippet
}

/**
 * 更新片段
 */
function updateSnippet(id: string, updates: Partial<Snippet>): void {
  const index = snippets.value.findIndex(s => s.id === id)
  if (index !== -1) {
    snippets.value[index] = {
      ...snippets.value[index],
      ...updates,
      updatedAt: Date.now()
    }
    saveData()
  }
}

/**
 * 删除片段
 */
function deleteSnippet(id: string): void {
  snippets.value = snippets.value.filter(s => s.id !== id)
  saveData()
}

/**
 * 切换片段启用状态
 */
function toggleSnippet(id: string): void {
  const snippet = snippets.value.find(s => s.id === id)
  if (snippet) {
    snippet.enabled = !snippet.enabled
    snippet.updatedAt = Date.now()
    saveData()
  }
}

/**
 * 增加使用次数
 */
function incrementUsage(id: string): void {
  const snippet = snippets.value.find(s => s.id === id)
  if (snippet) {
    snippet.usageCount++
    saveData()
  }
}

// ==================== 计算属性 ====================

/**
 * 当前分组的片段列表
 */
const currentSnippets = computed(() => {
  if (!currentGroupId.value) return snippets.value
  return snippets.value.filter(s => s.groupId === currentGroupId.value)
})

/**
 * 获取分组下的片段数量
 */
function getGroupSnippetCount(groupId: string): number {
  return snippets.value.filter(s => s.groupId === groupId).length
}

/**
 * 所有启用的片段
 */
const enabledSnippets = computed(() => {
  return snippets.value.filter(s => s.enabled)
})

// ==================== 设置操作 ====================

/**
 * 更新设置
 */
function updateSettings(updates: Partial<PluginSettings>): void {
  settings.value = { ...settings.value, ...updates }
  saveData()
}

// ==================== 导入导出 ====================

/**
 * 导出数据
 */
function exportData(): string {
  const data: StorageData = {
    groups: groups.value,
    snippets: snippets.value,
    settings: settings.value
  }
  return JSON.stringify(data, null, 2)
}

/**
 * 导入数据
 */
async function importData(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr) as StorageData
    
    if (!data.groups || !data.snippets) {
      throw new Error('无效的数据格式')
    }
    
    groups.value = data.groups
    snippets.value = data.snippets
    if (data.settings) {
      settings.value = { ...DEFAULT_SETTINGS, ...data.settings }
    }
    
    await saveData()
    return true
  } catch (error) {
    console.error('[超级文本片段] 导入数据失败:', error)
    return false
  }
}

/**
 * 使用片段存储
 */
export function useSnippetStore() {
  return {
    // 状态
    groups,
    snippets,
    settings,
    isLoading,
    currentGroupId,
    
    // 计算属性
    currentSnippets,
    enabledSnippets,
    
    // 方法
    loadData,
    saveData,
    
    // 分组操作
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupSnippetCount,
    
    // 片段操作
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleSnippet,
    incrementUsage,
    
    // 设置
    updateSettings,
    
    // 导入导出
    exportData,
    importData
  }
}
