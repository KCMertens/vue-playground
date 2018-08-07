/*
 * We use vuex-typex to provide type-safety in our vuex store.
 * See https://gist.github.com/KCMertens/39c93ee51750772e8e98e5a26fc76c62 for some more information.
 */

import Vue from 'vue';
import Vuex from 'vuex';
import {getStoreBuilder} from 'vuex-typex';

import corporaModule, {CorporaState} from '@/store/corporastore';
import appModule, {AppState, actions as appActions} from '@/store/appstore';

Vue.use(Vuex);

export interface RootState {
    app: AppState;
    corpora: CorporaState;
}

const b = getStoreBuilder<RootState>();

export const actions = {
    init: b.dispatch(() => {
        appActions.init();
    }, 'init'),
};

// -----------------------------

// JS Modules are only ran on first use, so ensure the modules are ran before we call .vuexStore
// to ensure the store modules have registered with the StoreBuilder.
// Simply importing the module doesn't work, since webpack detects its unused, and doesn't run the module.
// Importing/using type exports also doesn't work, since those are removed by the typescript compiler before webpack.
appModule();
corporaModule();

// Initial state for modules already provided when the module was registered 
// with this builder. So we would only have to supply our own initial state.
// But we have no state, so we don't need to provide anything here.
const store = b.vuexStore();
actions.init();
export default store;
