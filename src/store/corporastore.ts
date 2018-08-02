import {getStoreBuilder} from 'vuex-typex';

import * as Api from '@/api';
import {RootState} from '@/store';

import * as BLTypes from '@/types/blacklabtypes';
import { NormalizedIndex, ApiError } from '@/types/apptypes';

export interface CorporaState {
    corpora: NormalizedIndex[]|null;
    error: ApiError|null;
}
const initialState: CorporaState = {
    corpora: null,
    error: null,
};

// Same store builder instance as used by root store, so no 
// need to explicitly register the module. anywhere
const b = getStoreBuilder<RootState>().module('corpora', initialState);

const mutations = {
    corpora: b.commit((state, payload: NormalizedIndex[]) => {
        state.corpora = payload;
        state.error = null;
    }, 'setCorpora'),
    error: b.commit((state, payload: ApiError) => state.error = payload, 'setCorporaError'),
};

export const actions = {
    load: b.dispatch(async () => {
        try {
            const corpora = await Api.blacklab.getCorpora();
            mutations.corpora(corpora);
        } catch (error) {
            mutations.error(error);
        }
        
        // .then(mutations.corpora, mutations.error);
    }, 'load'),
};

export const get = {
    corpora: b.read(state => state.corpora, 'getCorpora'),
    networkError: b.read(state => state.error, 'getCorporaError'),
};

export default () => {/**/};
