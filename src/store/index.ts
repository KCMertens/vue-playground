/*
 * We use vuex-typex to provide type-safety in our vuex store.
 * See https://gist.github.com/KCMertens/39c93ee51750772e8e98e5a26fc76c62 for some more information.
 */

import Vue from 'vue';
import Vuex from 'vuex';
import {getStoreBuilder} from 'vuex-typex';

import {normalizeIndices} from '@/utils/blacklabutils';

import * as appStore from '@/store/appstore';
import * as corporaStore from '@/store/corporastore';
import * as formatStore from '@/store/formatstore';
import * as userStore from '@/store/userstore';

import * as api from '@/api';
import { BLUser } from '@/types/blacklabtypes';
import { AppConfig, NormalizedFormat, NormalizedIndex, ApiError } from '@/types/apptypes';
import { swallowError } from '@/utils/apiutils';

Vue.use(Vuex);

type ModuleRootState = {
    app: appStore.RootState;
    corpora: corporaStore.RootState;
    formats: formatStore.RootState;
    user: userStore.RootState;
};

type OwnRootState = {
    initialized: boolean;
};

export type RootState = ModuleRootState&OwnRootState;

const initialState: RootState = {
    app: appStore.initialState,
    corpora: corporaStore.initialState,
    formats: formatStore.initialState,
    user: userStore.initialState,

    initialized: false,
};

const b = getStoreBuilder<RootState>();

const mutations = {
    initialize: b.commit(
        (state, {config, user, corpora, formats}: 
        {config: AppConfig, user: BLUser, corpora: NormalizedIndex[], formats: NormalizedFormat[]}
    ) => {
        state.initialized = true;
        appStore.init(config);
        corporaStore.init(corpora);
        formatStore.init(formats);
        userStore.init(user);
    }, 'initialize'),
};

export const actions = {
    init: b.dispatch(() => {
        const requests = Promise.all([
            api.app.getConfig(),
            api.blacklab.getServerInfo(),
            api.blacklab.getFormats()
        ]);
        requests.then(([config, serverInfo, formats]) => {
            mutations.initialize({
                config, 
                user: serverInfo.user,
                corpora: normalizeIndices(serverInfo),
                formats
            });
        }, swallowError);
        return requests;
    }, 'init'),
};

export const get = {
    initialized: b.read((state) => state.initialized, 'isInitialized'),
};

const store = b.vuexStore({state: initialState});
// actions.init();
export default store;
