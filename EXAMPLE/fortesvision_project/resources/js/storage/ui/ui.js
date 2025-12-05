import settingsDialogModule from "@/storage/ui/modals/settingsDialogModule.js";
import batchesContextMenuModule from "@/storage/ui/contextMenu/batchesContextMenuModule.js";
import imagesContextMenuModule from "@/storage/ui/contextMenu/imagesContextMenuModule.js";
import projectsContextMenuModule from "@/storage/ui/contextMenu/projectsContextMenuModule.js";
import projectInfoModalModule from "@/storage/ui/modals/projectInfoModalModule.js";
import imageInfoModalModule from "@/storage/ui/modals/imageInfoModalModule.js";
import sidebarImageContextMenuModule from "@/storage/ui/contextMenu/sidebarImageContextMenuModule.js";

export default {
    namespaced: true,
    modules: {
        contextMenu: {
            namespaced: true,
            modules: {
                projects: projectsContextMenuModule,
                batches: batchesContextMenuModule,
                images: imagesContextMenuModule,
            }
        },
        settingsDialog: settingsDialogModule,
        projectInfoModal: projectInfoModalModule,
        imageInfoModal: imageInfoModalModule
    }
};
