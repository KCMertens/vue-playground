import Vue from 'vue';
import Vuex from 'vuex';

import * as Api from './api';


Vue.use(Vuex);

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production', // strict is slow, disable in prod
  state: {
    appConfig: undefined,
  },
  mutations: {
    _appConfig(state, config) { 
      state.appConfig = config; 
    },
  },
  actions: {
    async init(context) {
      context.commit('_appConfig', await Api.getAppConfig());
    },
  },
  getters: {
    appConfig: state => state.appConfig, 
  },
});

store.dispatch('init');

export default store;
