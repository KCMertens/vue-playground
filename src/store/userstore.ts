import Vuex from 'vuex';
import {getStoreBuilder} from 'vuex-typex';

import {RootState as SuperRootState} from '@/store';
import {swallowError} from '@/utils/apiutils';
import {BLServer, BLUser} from '@/types/blacklabtypes';
import * as api from '@/api';

export type RootState = {
    initialized: boolean;
    user: BLUser|null;
};

export const initialState = {
    initialized: false,
    user: null,
};

const b = getStoreBuilder<SuperRootState>().module<RootState>('user', initialState);

const mutations = {
    user: b.commit((state, payload: BLUser) => {
        state.initialized = true;
        state.user = payload;
    }, 'setUser'),
};

export const actions = {
    load: b.dispatch((state, context) => {
        const request = api.blacklab.getUser();
        request.then(mutations.user, swallowError);
        return request;
    }, 'load'),
};

export const get = {
    initialized: b.read(state => state.initialized, 'isInitialized'),
    user: b.read(state => state.user, 'getUser'),
};

export const init = (user: BLUser) => {
    if (get.initialized()) {
        return;
    }

    mutations.user(user);
};

