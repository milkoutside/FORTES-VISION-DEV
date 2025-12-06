<script setup>
import { computed, ref } from 'vue';
import StatusManager from './StatusManager.vue';
import UserManager from './UserManager.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:visible']);

const internalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const activeTab = ref('statuses');
</script>

<template>
  <Dialog
    v-model:visible="internalVisible"
    header="Settings"
    modal
    :draggable="false"
    blockScroll
    dismissableMask
    class="settings-dialog"
    :style="{ width: '100vw', maxWidth: '100vw', height: '100vh', maxHeight: '100vh', margin: 0, top: 0 }"
    :contentStyle="{ height: 'calc(100vh - 80px)', overflow: 'auto' }"
  >
    <Tabs v-model:value="activeTab" class="settings-tabs">
      <TabList>
        <Tab value="statuses">Statuses</Tab>
        <Tab value="users">Users</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="statuses">
          <StatusManager />
        </TabPanel>
        <TabPanel value="users">
          <UserManager />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Dialog>
</template>

<style scoped>
.settings-dialog :deep(.p-dialog) {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  margin: 0 !important;
  top: 0 !important;
  left: 0 !important;
  border-radius: 0 !important;
}

.settings-dialog :deep(.p-dialog-header) {
  font-size: 1.25rem;
  font-weight: 600;
}

.settings-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-tabs :deep(.p-tabpanels) {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.settings-tabs :deep(.p-tabpanel) {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>

