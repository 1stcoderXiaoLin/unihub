<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

const props = defineProps<{
  messages: ToastMessage[]
}>()

const emit = defineEmits<{
  dismiss: [id: number]
}>()

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
}

const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <TransitionGroup
        name="toast"
        tag="div"
        class="space-y-2"
      >
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[400px] p-4 rounded-lg shadow-lg bg-card border border-border"
        >
          <!-- 图标 -->
          <div
            class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            :class="colors[msg.type]"
          >
            <component
              :is="icons[msg.type]"
              class="w-3 h-3 text-white"
            />
          </div>
          
          <!-- 内容 -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground">{{ msg.title }}</p>
            <p v-if="msg.message" class="text-xs text-muted-foreground mt-0.5">
              {{ msg.message }}
            </p>
          </div>
          
          <!-- 关闭按钮 -->
          <button
            @click="emit('dismiss', msg.id)"
            class="w-5 h-5 rounded flex items-center justify-center hover:bg-accent transition-colors shrink-0"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
