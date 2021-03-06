import Vue from 'vue';
import Router from 'vue-router';

import Home from '@/views/Home.vue';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
        },
        {
            path: '/about',
            name: 'about',
            // route level code-splitting
            // this generates a separate chunk (about.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import(/* webpackChunkName: "about" */ './views/About.vue'),
        },
        {
            path: '/corpora',
            name: 'corpora',
            component: () => import('./views/Corpora.vue'),
        },
        {
            path: '/formats',
            name: 'formats',
            component: () => import('./views/Formats.vue'),
        },
        {
            path: '/create-corpus',
            name: 'New corpus',
            component: () => import('./views/CreateCorpus.vue')
        },
        {
            path: '/create-format',
            name: 'New format',
            component: () => import ('./views/CreateFormat.vue')
        }
    ],
});
