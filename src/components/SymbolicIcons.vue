<template>
  <component
    :is="IconComponent || Icons.AlarmSymbolic"
    v-bind="$attrs"
    :size="props.size"
    :color="props.color"
    :opacity="props.opacity"
  />
  
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as Icons from '../icons';
import type { SymbolicIconsProps } from '../types/SymbolicIconsProps';
import type { IconNames } from '../icons';

const props = defineProps<{ name: IconNames | string } & SymbolicIconsProps>();

const IconComponent = computed(() => {
  const target = String(props.name).toLowerCase();
  const found = Object.entries(Icons).find(([key]) => key.toLowerCase() === target)?.[1] as any;
  return found;
});
</script>


