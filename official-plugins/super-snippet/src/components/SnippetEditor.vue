<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Snippet, SnippetGroup, PasteMethod, PostAction, CommandType } from '@/types'
import { X, Plus, Braces } from 'lucide-vue-next'

const props = defineProps<{
  snippet: Snippet | null
  isCreating: boolean
  groups: SnippetGroup[]
  currentGroupId: string | null
}>()

const emit = defineEmits<{
  save: [data: Partial<Snippet>]
  cancel: []
}>()

// 表单数据
const form = ref({
  description: '',
  groupId: '',
  keywords: [] as string[],
  content: '',
  pasteMethod: 'shortcut' as PasteMethod,
  postAction: 'restore' as PostAction,
  commandType: 'default' as CommandType,
  globalShortcut: ''
})

// 关键字输入
const keywordInput = ref('')

// 粘贴方式选项
const pasteMethodOptions = [
  { value: 'shortcut', label: '模拟快捷键', desc: '常规的粘贴场景，兼容性更好，适用于绝大多数的应用场景。原理是按下键盘 Ctrl + V' },
  { value: 'keyboard', label: '键盘输入', desc: '逐字符输入，适用于不支持粘贴的场景' },
  { value: 'terminal', label: '终端执行命令', desc: '在终端中执行命令' }
]

// 后置动作选项
const postActionOptions = [
  { value: 'restore', label: '还原剪贴板内容' },
  { value: 'keep', label: '保留剪贴板内容' },
  { value: 'copy-only', label: '仅复制文本片段' },
  { value: 'enter', label: '按下回车键' }
]

// 内置占位符
const builtinPlaceholders = [
  { key: 'date', desc: '当前日期' },
  { key: 'time', desc: '当前时间' },
  { key: 'datetime', desc: '日期时间' },
  { key: 'timestamp', desc: '时间戳' },
  { key: 'clipboard', desc: '剪贴板内容' },
  { key: 'random', desc: '随机字符串' },
  { key: 'uuid', desc: 'UUID' }
]

// 初始化表单
watch(() => props.snippet, (newVal) => {
  if (newVal) {
    form.value = {
      description: newVal.description,
      groupId: newVal.groupId,
      keywords: [...newVal.keywords],
      content: newVal.content,
      pasteMethod: newVal.pasteMethod,
      postAction: newVal.postAction,
      commandType: newVal.commandType,
      globalShortcut: newVal.globalShortcut || ''
    }
  } else {
    // 创建新片段时的默认值
    form.value = {
      description: '',
      groupId: props.currentGroupId || 'default',
      keywords: [],
      content: '',
      pasteMethod: 'shortcut',
      postAction: 'restore',
      commandType: 'default',
      globalShortcut: ''
    }
  }
}, { immediate: true })

// 添加关键字
function addKeyword() {
  const keyword = keywordInput.value.trim()
  if (keyword && !form.value.keywords.includes(keyword)) {
    form.value.keywords.push(keyword)
  }
  keywordInput.value = ''
}

// 移除关键字
function removeKeyword(keyword: string) {
  form.value.keywords = form.value.keywords.filter(k => k !== keyword)
}

// 插入占位符
function insertPlaceholder(key: string) {
  form.value.content += `{${key}}`
}

// 保存
function handleSave() {
  if (!form.value.description.trim() && !form.value.content.trim()) {
    alert('请填写说明或文本内容')
    return
  }
  
  emit('save', {
    description: form.value.description,
    groupId: form.value.groupId,
    keywords: form.value.keywords,
    content: form.value.content,
    pasteMethod: form.value.pasteMethod,
    postAction: form.value.postAction,
    commandType: form.value.commandType,
    globalShortcut: form.value.globalShortcut || undefined
  })
}

// 标题
const title = computed(() => props.isCreating ? '新建文本片段' : '编辑文本片段')
</script>

<template>
  <div class="fixed inset-0 z-50 flex">
    <!-- 遮罩 -->
    <div
      class="absolute inset-0 bg-black/50"
      @click="emit('cancel')"
    />
    
    <!-- 编辑面板 -->
    <div class="absolute right-0 top-0 bottom-0 w-[600px] bg-card shadow-xl flex flex-col">
      <!-- 标题栏 -->
      <div class="h-14 px-6 flex items-center justify-between border-b border-border shrink-0">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button
          @click="emit('cancel')"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- 表单内容 -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- 说明 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">说明</label>
          <input
            v-model="form.description"
            type="text"
            placeholder="输入片段说明"
            class="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        <!-- 分组 -->
        <div class="flex gap-4">
          <div class="flex-1 space-y-2">
            <label class="text-sm font-medium">所在分组</label>
            <select
              v-model="form.groupId"
              class="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- 关键字 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">关键字</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="keyword in form.keywords"
              :key="keyword"
              class="keyword-tag flex items-center gap-1"
            >
              {{ keyword }}
              <button
                @click="removeKeyword(keyword)"
                class="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="keywordInput"
              type="text"
              placeholder="输入关键字后按回车添加"
              class="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              @keyup.enter="addKeyword"
            />
            <button
              @click="addKeyword"
              class="h-10 px-4 rounded-lg border border-border flex items-center gap-2 hover:bg-accent transition-colors"
            >
              <Plus class="w-4 h-4" />
              继续添加
            </button>
          </div>
        </div>
        
        <!-- 文本内容 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">文本片段</label>
            <div class="flex items-center gap-1">
              <button
                class="h-7 px-2 rounded text-xs flex items-center gap-1 border border-border hover:bg-accent transition-colors"
                title="插入占位符"
              >
                <Braces class="w-3 h-3" />
                <span>{ }</span>
              </button>
              <span class="text-xs text-muted-foreground ml-2">多参数分隔符</span>
            </div>
          </div>
          <textarea
            v-model="form.content"
            placeholder="输入文本内容，支持使用 {变量名} 插入占位符"
            rows="6"
            class="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground">
            您可以在文本片段中添加占位符，可以更加灵活的对片段内容进行动态处理。
            <br />
            点击上方 { } 按钮选择要插入占位符，即可在当前光标位置插入占位符。
            <a href="#" class="text-primary hover:underline">查看教程</a>
          </p>
          
          <!-- 快捷占位符 -->
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="ph in builtinPlaceholders"
              :key="ph.key"
              @click="insertPlaceholder(ph.key)"
              class="h-7 px-2 rounded text-xs border border-border hover:bg-accent transition-colors"
              :title="ph.desc"
            >
              {{"{"}}{{ ph.key }}{{"}"}}
            </button>
          </div>
        </div>
        
        <!-- 粘贴方式 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">粘贴方式</label>
          <div class="flex gap-2">
            <button
              v-for="opt in pasteMethodOptions"
              :key="opt.value"
              @click="form.pasteMethod = opt.value as PasteMethod"
              class="h-10 px-4 rounded-lg border text-sm transition-colors"
              :class="form.pasteMethod === opt.value 
                ? 'border-primary bg-primary text-primary-foreground' 
                : 'border-border hover:bg-accent'"
            >
              {{ opt.label }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ pasteMethodOptions.find(o => o.value === form.pasteMethod)?.desc }}
          </p>
        </div>
        
        <!-- 后置动作 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">后置动作</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in postActionOptions"
              :key="opt.value"
              @click="form.postAction = opt.value as PostAction"
              class="h-10 px-4 rounded-lg border text-sm transition-colors"
              :class="form.postAction === opt.value 
                ? 'border-primary bg-primary text-primary-foreground' 
                : 'border-border hover:bg-accent'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        
        <!-- 指令类型 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">指令类型</label>
          <select
            v-model="form.commandType"
            class="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="default">默认</option>
            <option value="shell">Shell 命令</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        <!-- 全局快捷键 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">全局快捷键</label>
          <div class="flex gap-2">
            <select
              v-model="form.globalShortcut"
              class="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled
            >
              <option value="">请选择关键字</option>
            </select>
            <button
              class="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
              disabled
            >
              设置快捷键
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            先选择要配置哪个关键字为全局快捷键，然后点击按钮即跳转到快捷键设置页面
          </p>
        </div>
      </div>
      
      <!-- 底部操作 -->
      <div class="h-16 px-6 flex items-center justify-end gap-3 border-t border-border shrink-0">
        <button
          @click="emit('cancel')"
          class="h-10 px-6 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSave"
          class="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>
