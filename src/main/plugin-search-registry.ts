/**
 * 插件搜索项注册表
 * 管理插件注册的自定义搜索项，供全局搜索使用
 */

import { createLogger } from '../shared/logger'

const logger = createLogger('plugin-search-registry')

// 插件搜索项
export interface PluginSearchItem {
  id: string // 搜索项唯一 ID
  title: string // 显示标题
  subtitle?: string // 副标题/描述
  icon?: string // 图标 URL
  keywords: string[] // 搜索关键词
  data?: unknown // 附加数据（执行时传回）
}

// 完整的搜索项（包含插件信息）
export interface RegisteredSearchItem extends PluginSearchItem {
  pluginId: string // 所属插件 ID
  registeredAt: number // 注册时间
}

class PluginSearchRegistry {
  // 存储结构：pluginId -> Map<itemId, item>
  private registry: Map<string, Map<string, RegisteredSearchItem>> = new Map()

  /**
   * 注册搜索项
   */
  register(pluginId: string, items: PluginSearchItem[]): void {
    if (!this.registry.has(pluginId)) {
      this.registry.set(pluginId, new Map())
    }

    const pluginItems = this.registry.get(pluginId)!
    const now = Date.now()

    for (const item of items) {
      const registeredItem: RegisteredSearchItem = {
        ...item,
        pluginId,
        registeredAt: now
      }
      pluginItems.set(item.id, registeredItem)
    }

    logger.info({ pluginId, count: items.length }, '注册搜索项')
  }

  /**
   * 取消注册搜索项
   * @param pluginId 插件 ID
   * @param itemIds 要取消的项 ID，不传则取消该插件所有项
   */
  unregister(pluginId: string, itemIds?: string[]): void {
    const pluginItems = this.registry.get(pluginId)
    if (!pluginItems) return

    if (itemIds && itemIds.length > 0) {
      for (const id of itemIds) {
        pluginItems.delete(id)
      }
      logger.info({ pluginId, count: itemIds.length }, '取消注册搜索项')
    } else {
      const count = pluginItems.size
      this.registry.delete(pluginId)
      logger.info({ pluginId, count }, '取消注册插件所有搜索项')
    }
  }

  /**
   * 获取所有注册的搜索项
   */
  getAll(): RegisteredSearchItem[] {
    const allItems: RegisteredSearchItem[] = []

    for (const pluginItems of this.registry.values()) {
      for (const item of pluginItems.values()) {
        allItems.push(item)
      }
    }

    return allItems
  }

  /**
   * 获取指定插件的搜索项
   */
  getByPlugin(pluginId: string): RegisteredSearchItem[] {
    const pluginItems = this.registry.get(pluginId)
    if (!pluginItems) return []
    return Array.from(pluginItems.values())
  }

  /**
   * 清除指定插件的所有搜索项
   */
  clearPlugin(pluginId: string): void {
    this.registry.delete(pluginId)
    logger.info({ pluginId }, '清除插件搜索项')
  }

  /**
   * 清除所有搜索项
   */
  clearAll(): void {
    this.registry.clear()
    logger.info('清除所有插件搜索项')
  }

  /**
   * 获取统计信息
   */
  getStats(): { pluginCount: number; itemCount: number } {
    let itemCount = 0
    for (const pluginItems of this.registry.values()) {
      itemCount += pluginItems.size
    }
    return {
      pluginCount: this.registry.size,
      itemCount
    }
  }
}

// 导出单例
export const pluginSearchRegistry = new PluginSearchRegistry()
