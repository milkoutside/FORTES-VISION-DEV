<template>
    <div class="main-container">
        <Header></Header>
        <div class="content-wrapper">
            <!-- Левая колонка -->
            <div class="sidebar-column">
                <ProjectsSidebar></ProjectsSidebar>
            </div>
            <!-- Правая колонка -->
            <div class="main-column">
                <CalendarHeader />
                <div class="calendar-wrapper">
                 <ImagesCalendar></ImagesCalendar>
                    <!--                    <ProjectCells></ProjectCells>-->
                </div>
            </div>
            <div class="fixed-spinner" v-if="loading">
                <ProgressSpinner />
            </div>
        </div>
        <ConfirmDialog />
        <ProjectInfoModal />
        <ImageInfoModal />
    </div>
</template>
<script setup>
import store from "@/storage/storage.js";
import {computed, onMounted, ref} from "vue";
import ConfirmDialog from "primevue/confirmdialog";
import Header from "@/components/headers/Header.vue";
import CalendarHeader from "@/components/headers/CalendarHeader.vue";
import ProjectsSidebar from "@/components/sidebar/ProjectsSidebar.vue";
import ProjectInfoModal from "@/components/sidebar/modals/ProjectInfoModal.vue";
import ImageInfoModal from "@/components/sidebar/modals/ImageInfoModal.vue";
import ImagesCalendar from "@/components/cells/ImagesCalendar.vue";
import ProgressSpinner from "primevue/progressspinner";
const loading = ref(false);
onMounted(async () => {
    loading.value = true;
    await store.dispatch('statuses/fetchAllStatuses');
    await store.dispatch('users/fetchAllUsers');
    loading.value = false;
})
</script>
<style scoped>
.main-container {
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.sidebar-column {
    width: 25%;
    min-width: 300px;
    height: 100%;
    overflow: hidden;
}

.main-column {
    flex: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.calendar-wrapper {
    flex: 1;
    overflow: hidden;
}

.fixed-spinner {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    z-index: 99999999;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
