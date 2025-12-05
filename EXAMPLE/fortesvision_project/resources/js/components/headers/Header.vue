
<template>
    <div class="header">
        <div class="header-content row">
            <div class="header-left col-3 d-flex">
                <span style="color:green">Projects</span>
                <CreateProjectModal class="mx-5"></CreateProjectModal>
            </div>
            <div class="col-8">
                <StatusesColorPicker></StatusesColorPicker>
            </div>
            <div class="col-1 text-end">
                <Button
                    icon="pi pi-cog"
                    class="settings-btn"
                    text
                    rounded
                    @click="openSettings"
                    size="medium"
                />
            </div>
        </div>
        <SettingsDialog></SettingsDialog>
    </div>
</template>

<script setup>
import StatusesColorPicker from "@/components/statuses/StatusesColorPicker.vue";

import storage from "@/storage/storage.js";
import {computed, watch} from "vue";
import Button from "primevue/button";
import store from "@/storage/storage.js";
import SettingsDialog from "@/components/settings/dialogs/SettingsDialog.vue";
import CreateProjectModal from "@/components/headers/modals/CreateProjectModal.vue";

const statusesMode = computed(() => storage.getters['statuses/statusesMode'])


const openSettings = () => {
    console.log("open settings")
    store.commit('ui/settingsDialog/SHOW_DIALOG');
}
</script>

<style scoped>
.header {
    height: 8vh;
    min-height: 8vh;
    border-bottom: 2px solid #ddd;
    background-color: #fff;
    flex-shrink: 0;
}

.header-content {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 20px;
}

.header-left {
    width: 25%;
    display: flex;
    align-items: center;
    gap: 15px;
}

.status-text {
    color: #28a745;
    font-weight: 500;
}

.header-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-right {
    width: 60px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.settings-btn {
    width: 40px;
    height: 40px;
}
</style>
