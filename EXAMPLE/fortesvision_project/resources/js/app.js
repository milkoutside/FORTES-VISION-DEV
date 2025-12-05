
import { createApp } from 'vue';

import Index from './Index.vue';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import 'primeicons/primeicons.css'
import Storage from "@/storage/storage.js";
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice'
const app = createApp(Index);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false,
        },
    },

});
app.use(ToastService);
app.use(ConfirmationService);
import { RecycleScroller, DynamicScroller,DynamicScrollerItem } from 'vue3-virtual-scroller'
import 'vue3-virtual-scroller/dist/vue3-virtual-scroller.css'

app.component('RecycleScroller', RecycleScroller)
app.component('DynamicScroller', DynamicScroller)
app.component('DynamicScrollerItem', DynamicScrollerItem)

app.use(Storage);
app.mount('#app');

