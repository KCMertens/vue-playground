import { getStoreBuilder } from 'vuex-typex';

import * as api from '@/api';
import {swallowError} from '@/utils/apiutils';
import { RootState as SuperRootState } from '@/store';

import { AppConfig } from '@/types/apptypes';

export type RootState = {
    appConfig: AppConfig|null;
    initialized: boolean;
};

export const initialState: RootState = {
    appConfig: null,
    initialized: false,
};

// Same store builder instance as used by root store, so this module is implicitly registered
const b = getStoreBuilder<SuperRootState>().module<RootState>('app', initialState);

const mutations = {
    config: b.commit((state, payload: AppConfig) => {
        state.appConfig = payload;
        state.initialized = true;
    }, 'setConfig'),
};

export const actions = {
    load: b.dispatch((state) => {
        const request = api.app.getConfig();
        request.then(mutations.config, swallowError);
        return request;
    }, 'init'),
};

export const get = {
    config: b.read(state => state.appConfig, 'getConfig'),
    initialized: b.read(state => state.initialized, 'isInitialized'),
};

export const init = (config: AppConfig) => {
    if (get.initialized()) {
        return;
    }

    mutations.config(config);
};