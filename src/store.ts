/*
 * We use vuex-typex to provide type-safety in our vuex store.
 * See https://gist.github.com/KCMertens/39c93ee51750772e8e98e5a26fc76c62 for some more information.
 */

import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import {getStoreBuilder} from 'vuex-typex';

import * as Api from '@/api';
import * as BLTypes from '@/types/blacklab';
import * as AppTypes from '@/types/app';

Vue.use(Vuex);

export interface RootState {
    appConfig: AppTypes.AppConfig|null;
    corpora: BLTypes.BLIndex[]|null;
    unrecoverable: Error|null;
}
const initialState: RootState = {
    appConfig: null,
    corpora: null,
    unrecoverable: null,
};


const b = getStoreBuilder<RootState>();

/**
 * We don't export these on purpose
 * We use mutations/commits because directly writing to store.state
 * from actions won't log events, breaking rewind/replay and hiding the mutations from the devtools.
 */
const mutations = {
    setAppConfig: b.commit((state, payload: AppTypes.AppConfig) => state.appConfig = payload, 'setAppConfig'),
    unrecoverable: b.commit((state, payload: Error) => state.unrecoverable = payload, 'unrecoverableError'),
};

export const actions = {
    init: b.dispatch(function init() {
        Api.getAppConfig().then(mutations.setAppConfig, mutations.unrecoverable);
    }, 'init'),
};

export const getters = {
    getAppConfig: b.read(state => state.appConfig, 'getAppConfig'),
    getUnrecoverableError: b.read(state => state.unrecoverable, 'getUnrecoverableError'),
};

// -----------------------------

const store = b.vuexStore({ state: initialState });
actions.init();
export default store;
