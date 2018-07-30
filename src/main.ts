import Vue from 'vue';

import App from '@/App.vue';
import router from '@/router';
import store from './store';
import * as Api from './api';

Vue.config.productionTip = false;

// initStore();

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
