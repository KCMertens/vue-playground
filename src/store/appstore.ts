import { getStoreBuilder } from 'vuex-typex';

import { app as AppAPI} from '@/api';
import { RootState } from '@/store';

import { ApiError, AppConfig } from '@/types/apptypes';

export type AppState = {
    appConfig: AppConfig|null;
    fatalError: ApiError|null;
};

const initialState: AppState = {
    appConfig: null,
    fatalError: null,
};

// Same store builder instance as used by root store, so this module is implicitly registered
const b = getStoreBuilder<RootState>().module('app', initialState);

/**
 * We don't export these on purpose
 * We use mutations/commits because directly writing to store.state
 * from actions won't log events, breaking rewind/replay and hiding the mutations from the devtools.
 */
const mutations = {
    setConfig: b.commit((state, payload: AppConfig) => state.appConfig = payload, 'setConfig'),
    setFatalError: b.commit((state, payload: ApiError) => state.fatalError = payload, 'setFatalError'),
};

export const actions = {
    init: b.dispatch(() => {
        AppAPI.config.then(mutations.setConfig, mutations.setFatalError);
    }, 'init'),
};

export const getters = {
    config: b.read(state => state.appConfig, 'getConfig'),
    fatalError: b.read(state => state.fatalError, 'getFatalError'),
};

// export default () => {/**/};
