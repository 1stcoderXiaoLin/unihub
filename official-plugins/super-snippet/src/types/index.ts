/**
 * 超级文本片段 - 类型定义
 */

// 粘贴方式
export type PasteMethod = 'shortcut' | 'keyboard' | 'terminal'

// 后置动作
export type PostAction = 'restore' | 'keep' | 'copy-only' | 'enter'

// 指令类型
export type CommandType = 'default' | 'shell' | 'custom'

// 片段分组
export interface SnippetGroup {
  id: string
  name: string
  icon?: string
  order: number
  createdAt: number
}

// 文本片段
export interface Snippet {
  id: string
  groupId: string
  description: string           // 说明
  keywords: string[]            // 关键字（多个）
  content: string               // 文本内容
  enabled: boolean              // 启用状态
  pasteMethod: PasteMethod      // 粘贴方式
  postAction: PostAction        // 后置动作
  commandType: CommandType      // 指令类型
  globalShortcut?: string       // 全局快捷键
  createdAt: number
  updatedAt: number
  usageCount: number            // 使用次数统计
}

// 插件配置
export interface PluginSettings {
  defaultPasteMethod: PasteMethod
  defaultPostAction: PostAction
  searchEnabled: boolean
  placeholders: Record<string, string>  // 自定义占位符
}

// 存储数据结构
export interface StorageData {
  groups: SnippetGroup[]
  snippets: Snippet[]
  settings: PluginSettings
}

// 默认设置
export const DEFAULT_SETTINGS: PluginSettings = {
  defaultPasteMethod: 'shortcut',
  defaultPostAction: 'restore',
  searchEnabled: true,
  placeholders: {}
}

// 默认分组
export const DEFAULT_GROUP: SnippetGroup = {
  id: 'default',
  name: '默认分组',
  icon: undefined,
  order: 0,
  createdAt: Date.now()
}
