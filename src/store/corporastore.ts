import {getStoreBuilder} from 'vuex-typex';

import * as Api from '@/api';
import {RootState} from '@/store';

import { NormalizedIndex, ApiError } from '@/types/apptypes';

export interface CorporaState {
    corpora: NormalizedIndex[]|null;
    error: ApiError|null;
    uploads: {
        [key: string]: {
            progress: number;
            error: ApiError|null;
            response: string|null;
        };
    };
}
const initialState: CorporaState = {
    corpora: null,
    error: null,
    uploads: {},
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
    
    uploadStart: b.commit((state, payload: string) => {
        state.uploads[payload] = {
            progress: 0,
            error: null,
            response: null,
        };
    }, 'startUpload'),
    uploadProgress: b.commit((state, payload: { id: string, progress: number }) => {
        state.uploads[payload.id].progress = payload.progress;
    }, 'uploadProgress'),
    uploadError: b.commit((state, payload: {id: string, error: ApiError}) => {
        state.uploads[payload.id].error = payload.error;
    }, 'uploadError'),
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

    uploadDocuments: b.dispatch((context, payload: {indexId: string, docs: FileList, meta?: FileList|null}) => {
        mutations.uploadStart(payload.indexId);
        Api.blacklab.uploadDocuments(
            payload.indexId, 
            payload.docs, 
            payload.meta, 
            progress => mutations.uploadProgress({id: payload.indexId, progress}),
        )
        .catch(error => mutations.uploadError({id: payload.indexId, error}));
    }, 'uploadDocuments'),
};

export const get = {
    corpora: b.read(state => state.corpora, 'getCorpora'),
    networkError: b.read(state => state.error, 'getCorporaError'),
};

export default () => {/**/};
