import { ref } from 'vue'
import type { Snippet } from '@/types'
import { useSnippetStore } from './useSnippetStore'

// 占位符处理
const BUILTIN_PLACEHOLDERS: Record<string, () => string> = {
  date: () => new Date().toLocaleDateString('zh-CN'),
  time: () => new Date().toLocaleTimeString('zh-CN'),
  datetime: () => new Date().toLocaleString('zh-CN'),
  timestamp: () => String(Date.now()),
  random: () => Math.random().toString(36).substring(2, 10),
  uuid: () => crypto.randomUUID(),
  year: () => String(new Date().getFullYear()),
  month: () => String(new Date().getMonth() + 1).padStart(2, '0'),
  day: () => String(new Date().getDate()).padStart(2, '0'),
  hour: () => String(new Date().getHours()).padStart(2, '0'),
  minute: () => String(new Date().getMinutes()).padStart(2, '0'),
  second: () => String(new Date().getSeconds()).padStart(2, '0')
}

// 执行状态
const isExecuting = ref(false)
const lastError = ref<string | null>(null)

/**
 * 处理占位符替换
 */
async function processPlaceholders(content: string): Promise<string> {
  let result = content
  
  // 处理内置占位符
  for (const [key, fn] of Object.entries(BUILTIN_PLACEHOLDERS)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'gi')
    result = result.replace(pattern, fn())
  }
  
  // 处理剪贴板占位符
  if (result.includes('{clipboard}')) {
    try {
      const clipboardText = await window.unihub.clipboard.readText()
      result = result.replace(/\{clipboard\}/gi, clipboardText)
    } catch (error) {
      console.warn('[超级文本片段] 读取剪贴板失败:', error)
    }
  }
  
  // TODO: 处理自定义占位符（弹窗输入）
  // 匹配 {input:提示文字} 或 {input:提示文字:默认值} 格式
  
  return result
}

/**
 * 执行片段粘贴
 */
async function executeSnippet(snippet: Snippet): Promise<boolean> {
  if (isExecuting.value) {
    console.warn('[超级文本片段] 正在执行中，请稍候')
    return false
  }
  
  try {
    isExecuting.value = true
    lastError.value = null
    
    const store = useSnippetStore()
    
    // 保存原始剪贴板内容（用于还原）
    let originalClipboard: string | null = null
    if (snippet.postAction === 'restore') {
      try {
        originalClipboard = await window.unihub.clipboard.readText()
      } catch {
        // 忽略读取失败
      }
    }
    
    // 处理占位符
    const processedContent = await processPlaceholders(snippet.content)
    
    // 根据粘贴方式执行
    switch (snippet.pasteMethod) {
      case 'shortcut':
        // 模拟快捷键粘贴 (Ctrl+V / Cmd+V)
        await window.unihub.clipboard.writeText(processedContent)
        await window.unihub.system.quickPaste({ hideWindow: true, delayMs: 100 })
        break
        
      case 'keyboard':
        // 键盘逐字输入 (TODO: 需要主应用支持)
        await window.unihub.clipboard.writeText(processedContent)
        await window.unihub.system.quickPaste({ hideWindow: true, delayMs: 100 })
        break
        
      case 'terminal':
        // 终端执行命令 (TODO: 需要主应用支持)
        await window.unihub.clipboard.writeText(processedContent)
        await window.unihub.system.quickPaste({ hideWindow: true, delayMs: 100 })
        break
    }
    
    // 处理后置动作
    switch (snippet.postAction) {
      case 'restore':
        // 还原剪贴板
        if (originalClipboard !== null) {
          await new Promise(resolve => setTimeout(resolve, 200))
          await window.unihub.clipboard.writeText(originalClipboard)
        }
        break
        
      case 'keep':
        // 保留当前内容，不做处理
        break
        
      case 'copy-only':
        // 仅复制，不粘贴
        await window.unihub.clipboard.writeText(processedContent)
        await window.unihub.notification.show({
          title: '已复制',
          body: snippet.description || '文本片段已复制到剪贴板'
        })
        break
        
      case 'enter':
        // 粘贴后按回车 (TODO: 需要主应用支持模拟按键)
        break
    }
    
    // 增加使用次数
    store.incrementUsage(snippet.id)
    
    console.log('[超级文本片段] 执行成功:', snippet.description)
    return true
    
  } catch (error) {
    lastError.value = error instanceof Error ? error.message : '执行失败'
    console.error('[超级文本片段] 执行失败:', error)
    return false
  } finally {
    isExecuting.value = false
  }
}

/**
 * 快速预览处理后的内容
 */
async function previewContent(content: string): Promise<string> {
  return processPlaceholders(content)
}

/**
 * 使用片段执行器
 */
export function useSnippetExecutor() {
  return {
    isExecuting,
    lastError,
    executeSnippet,
    previewContent,
    processPlaceholders,
    BUILTIN_PLACEHOLDERS
  }
}
