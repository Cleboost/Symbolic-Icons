<script setup lang="ts">
import * as Icons from 'symbolic-icons'
import { computed, ref } from 'vue'

const allIcons = computed(() => {
  return Object.entries(Icons)
    .filter(([key]) => key !== 'SymbolicIcons' && key !== 'IconNames' && key.endsWith('Symbolic'))
    .map(([name, component]) => ({ name, component }))
})

const searchQuery = ref('')

const filteredIcons = computed(() => {
  if (!searchQuery.value) return allIcons.value
  
  const query = searchQuery.value.toLowerCase()
  return allIcons.value.filter(icon => 
    icon.name.toLowerCase().includes(query)
  )
})

const selectedIcon = ref<{ name: string; component: any } | null>(null)
const copied = ref(false)

const openModal = (icon: { name: string; component: any }) => {
  selectedIcon.value = icon
  copied.value = false
}

const closeModal = () => {
  selectedIcon.value = null
  copied.value = false
}

const getCodeSnippet = (iconName: string) => {
  return `import { ${iconName} } from 'symbolic-icons'\n\n<${iconName} :size="32" />`
}

const copyCode = async () => {
  if (!selectedIcon.value) return
  
  const code = getCodeSnippet(selectedIcon.value.name)
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Error copying the code:', err)
  }
}
</script>

<template>
  <main class="main">
    <header class="header">
      <h1>Symbolic Icons Vue</h1>
      <p class="subtitle">{{ allIcons.length }} icons available</p>
      
      <div class="controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search an icon..." 
          class="search-input"
        />
      </div>
    </header>

    <div class="icons-grid">
      <div 
        v-for="icon in filteredIcons" 
        :key="icon.name" 
        class="icon-card"
        :title="icon.name"
        @click="openModal(icon)"
      >
        <component :is="icon.component" :size="32" class="icon" />
        <span class="icon-name">{{ icon.name }}</span>
      </div>
    </div>

    <div v-if="filteredIcons.length === 0" class="no-results">
      No icon found for "{{ searchQuery }}"
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedIcon" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeModal" aria-label="Close">×</button>
            
            <div class="modal-icon">
              <component :is="selectedIcon.component" :size="64" />
            </div>
            
            <h2 class="modal-title">{{ selectedIcon.name }}</h2>
            
            <div class="modal-code">
              <pre><code>{{ getCodeSnippet(selectedIcon.name) }}</code></pre>
            </div>
            
            <button class="modal-copy-btn" @click="copyCode">
              {{ copied ? '✓ Copied !' : 'Copy the code' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
.main {
  padding: 24px;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
}

h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.subtitle {
  margin: 8px 0 0;
  color: #666;
  font-size: 1rem;
}

.controls {
  margin-top: 24px;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4a90e2;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  background: white;
}

.icon-card:hover {
  border-color: #4a90e2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.icon {
  color: #1a1a1a;
  transition: color 0.2s;
}

.icon-card:hover .icon {
  color: #4a90e2;
}

.icon-name {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
}

.no-results {
  text-align: center;
  padding: 64px 24px;
  color: #999;
  font-size: 1.125rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #333;
}

.modal-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: #4a90e2;
}

.modal-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 24px;
}

.modal-code {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.modal-code pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #333;
}

.modal-code code {
  display: block;
  white-space: pre;
}

.modal-copy-btn {
  width: 100%;
  padding: 12px 24px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-copy-btn:hover {
  background: #357abd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.modal-copy-btn:active {
  transform: translateY(0);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>