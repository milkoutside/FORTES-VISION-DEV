import {createStore} from 'vuex';
import statusesModule from "@/storage/statuses/statusesModule.js";
import usersModule from "@/storage/users/usersModule.js";
import projectsModule from "@/storage/projects/projectsModule.js";
import calendarModule from "@/storage/calendar/calendarModule.js";
import uiModule from "@/storage/ui/ui.js";
import filterModule from "@/storage/sidebar/filterModule.js";
import coloredCellsModule from "@/storage/coloredCells/coloredCellsModule.js";
import sidebarImageContextMenuModule from "@/storage/ui/contextMenu/sidebarImageContextMenuModule.js";


const store = createStore({
    namespaced: true,
    modules: {
        statuses: statusesModule,
        users: usersModule,
        projects: projectsModule,
        calendar: calendarModule,
        ui: uiModule,
        coloredCells: coloredCellsModule,
        sidebar: {
            namespaced: true,
            modules: {
                filters: filterModule,
                sidebarImageContextMenu: sidebarImageContextMenuModule
            }
        }
    }
});

export default store;

