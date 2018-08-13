import Vuex from 'vuex';
import {getStoreBuilder} from 'vuex-typex';

import {RootState} from '@/store';
import {swallowError} from '@/utils/apiutils';
import {BLServer, BLUser} from '@/types/blacklabtypes';
import * as api from '@/api';

export type UserState = {
    initialized: boolean;
    user: BLUser|null;
};

const initialState = {
    initialized: false,
    user: null,
};

const b = getStoreBuilder<RootState>().module<UserState>('user', initialState);

const mutations = {
    user: b.commit((state, payload: BLUser) => {
        state.initialized = true;
        state.user = payload;
    }, 'setUser'),
};

const initAction = b.dispatch((state, constext) => {
    loadUserAction();
}, 'init');

const loadUserAction = b.dispatch((state, context) => {
    const request = api.blacklab.getUser();
    request.then(mutations.user, swallowError);
    return request;
}, 'loadUser');


export const actions = {
    init: initAction,
    loadUser: loadUserAction,
};

export const get = {
    initialized: b.read(state => state.initialized, 'isInitialized'),
    user: b.read(state => state.user, 'getUser'),
};