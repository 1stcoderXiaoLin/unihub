import { ref } from 'vue'
import type { ToastMessage } from '@/components/Toast.vue'

const messages = ref<ToastMessage[]>([])
let nextId = 1

/**
 * 显示 Toast 消息
 */
function show(
  type: ToastMessage['type'],
  title: string,
  message?: string,
  duration = 3000
): number {
  const id = nextId++
  
  messages.value.push({
    id,
    type,
    title,
    message,
    duration
  })
  
  // 自动消失
  if (duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }
  
  return id
}

/**
 * 关闭 Toast
 */
function dismiss(id: number): void {
  const index = messages.value.findIndex(m => m.id === id)
  if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

/**
 * 快捷方法
 */
function success(title: string, message?: string, duration?: number): number {
  return show('success', title, message, duration)
}

function error(title: string, message?: string, duration?: number): number {
  return show('error', title, message, duration)
}

function info(title: string, message?: string, duration?: number): number {
  return show('info', title, message, duration)
}

function warning(title: string, message?: string, duration?: number): number {
  return show('warning', title, message, duration)
}

/**
 * 使用 Toast
 */
export function useToast() {
  return {
    messages,
    show,
    dismiss,
    success,
    error,
    info,
    warning
  }
}
