import {createRouter, createWebHashHistory} from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import('./views/Search.vue')
        },
        {
            path: '/editor',
            component: () => import('./views/Editor.vue')
        },
    ]
});

export default router;
