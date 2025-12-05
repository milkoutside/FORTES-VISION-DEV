import { createStore } from 'vuex';
import calendarModule from "@/storage/calendarModule.js";
import settingsDialogModule from "@/storage/settingsDialogModule.js";
import statusesModule from "@/storage/statusesModule.js";
import projectsModule from "@/storage/projectsModule.js";
import usersModule from "@/storage/usersModule.js";
import projectsContextMenuModule from "@/storage/contextMenu/projectsContextMenuModule.js";
import batchesContextMenuModule from "@/storage/contextMenu/batchesContextMenuModule.js";
import imagesContextMenuModule from "@/storage/contextMenu/imagesContextMenuModule.js";
import cellsModule from "@/storage/calendar/cellsModule.js";
import imagesCalendarContextMenuModule from "@/storage/ui/contextMenu/imagesContextMenuModule.js";
import coloredCellsModule from "@/storage/coloredCellsModule.js";
import projectInfoModule from "@/storage/ui/modals/projectInfoModule.js";
import imageInfoModule from "@/storage/ui/modals/imageInfoModule.js";
import filtersModule from "@/storage/sidebar/filtersModule.js";


const store = createStore({
    modules: {
        calendar: calendarModule,
        cells: cellsModule,
        settingsDialog: settingsDialogModule,
        statuses: statusesModule,
        projects: projectsModule,
        users: usersModule,
        coloredCells: coloredCellsModule,
        sidebar: {
            namespaced: true,
            modules: {
                filters: filtersModule
            }
        },
        contextMenu: {
            namespaced: true,
            modules: {
                projects: projectsContextMenuModule,
                batches: batchesContextMenuModule,
                images: imagesContextMenuModule
            }
        },
        ui: {
            namespaced: true,
            modules: {
                contextMenu: {
                    namespaced: true,
                    modules: {
                        images: imagesCalendarContextMenuModule
                    }
                },
                modals: {
                    namespaced: true,
                    modules: {
                        projectInfo: projectInfoModule,
                        imageInfo: imageInfoModule
                    }
                }
            }
        }
    }
});

export default store;

