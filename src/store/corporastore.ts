import {getStoreBuilder} from 'vuex-typex';
import { Canceler } from 'axios';

import * as Api from '@/api';
import {RootState} from '@/store';

import { NormalizedIndex, ApiError } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

export interface CorporaState {
    /** Complete list of all corpora. Null when uninitialized. May be stale when error occurred. */
    corpora: NormalizedIndex[]|null;
    /** Any error encountered loading the list of corpora, null when last request was successful. */
    error: ApiError|null;
    uploads: {
        /** Keyed by full corpus id */
        [key: string]: {
            /** Null unless an upload is currently ongoing */
            progress: number|null;
            /** Cancel an ongoing upload, null if no upload in progress */
            cancel: Canceler|null;
            /** Error returned by the last attempted upload, null if upload was successful */
            // error: ApiError|null;
            // /** Response returned by the last attempted upload, null upload was unsuccessful */
            // response: BLTypes.BLResponse|null;
        };
    };
}
const initialState: CorporaState = {
    corpora: null,
    error: null,
    uploads: {},
};

/** Ongoing requests for corpora, so we don't launch refreshes for the same corpus twice */
const refreshes: {[key: string]: Promise<NormalizedIndex>|undefined} = {};

// Same store builder instance as used by root store, so no 
// need to explicitly register the module. anywhere
const b = getStoreBuilder<RootState>().module('corpora', initialState);

const mutations = {
    corpora: b.commit((state, payload: NormalizedIndex[]) => {
        state.corpora = payload;
        state.error = null;

        // Remove upload state for deleted corpora, init upload state for new corpora
        const oldUploads = state.uploads;
        state.uploads = payload.reduce((newUploads, index) => {
            newUploads[index.id] = oldUploads[index.id] || {
                progress: null,
                error: null,
                response: null,
                cancel: null,
            };
            return newUploads;
        }, {} as CorporaState['uploads']);

    }, 'setCorpora'),
    corpus: b.commit((state, payload: NormalizedIndex) => {
        if (!state.corpora) {
            state.corpora = [];
        }
        // Can't use corpora[index] = {...}, see https://vuejs.org/2016/02/06/common-gotchas/
        const i = state.corpora.findIndex(c => c.id === payload.id);
        i !== -1 ? state.corpora.splice(i, 1, payload) : state.corpora.push(payload);
    }, 'setCorpus'),
    error: b.commit((state, payload: ApiError|null) => state.error = payload, 'setCorporaError'),
    

    // Uploads
    uploadStart: b.commit((state, payload: { id: string, cancel: Canceler}) => {
        state.uploads[payload.id] = {
            // error: null,
            // response: null,
            progress: 0,
            cancel: payload.cancel,
        };
    }, 'startUpload'),
    uploadProgress: b.commit((state, payload: { id: string, progress: number }) => {
        // Sometimes an event comes in even after the upload was cancelled
        // In this case, don't safe it.
        if (state.uploads[payload.id].cancel) { 
            state.uploads[payload.id].progress = payload.progress;
        }
        
    }, 'uploadProgress'),
    // uploadError: b.commit((state, payload: {id: string, error: ApiError}) => {
    //     state.uploads[payload.id] = {
    //         // error: payload.error,
    //         // response: null,
    //         progress: null,
    //         cancel: null,
    //     };
    // }, 'uploadError'),
    // For error, success and cancellation
    // Since the request's Promise is returned from the action, the application can access
    // any eventual response or error directly and we don't need to save them in the store
    uploadComplete: b.commit((state, payload: { id: string/*, response: BLTypes.BLResponse*/}) => {
        state.uploads[payload.id] = {
            // response: payload.response,
            // error: null,
            progress: null,
            cancel: null,
        };
    }, 'uploadComplete'),
    // uploadCanceled: b.commit((state, payload: {id: string}) => {
    //     console.log('processed cancellation');
    //     state.uploads[payload.id] = {
    //         // response: null,
    //         // error: null,
    //         progress: null,
    //         cancel: null,
    //     };
    // }, 'uploadCanceled')
};



const loadAction = b.dispatch(() => {
    const req = Api.blacklab.getCorpora();
    req.then(corpora => corpora.forEach(c => {
        if (c.indexProgress) {
            refreshAction({id: c.id});
        }   
    }));

    mutations.error(null);
    req.then(mutations.corpora, mutations.error);
}, 'load');


const refreshAction = b.dispatch((context, {id}: {id: string}) => {
    if (refreshes[id]) {
        return;
    }
    const request = refreshes[id] = Api.blacklab.getCorpus(id);

    request.finally(() => { // clear the now fulfilled request first
        if (refreshes[id] === request) {
            delete refreshes[id];
        }
    });

    request.then(corpus => { // so that we can launch a new request here if the corpus in indexing something
        mutations.corpus(corpus);
        if (corpus.indexProgress) {
            actions.refresh({id});
        }
    })
    .catch(e => { 
        console.log('error when refreshing corpus ' + id, e); 
        mutations.error(e); 
    });
}, 'refresh');

const uploadDocumentsAction = b.dispatch(async (
    context, 
    {id, docs, meta}: {id: string, docs: FileList, meta?: FileList|null}
) => {
    const onUploadProgress = (progress: number) => {
        mutations.uploadProgress({id, progress});
        if (progress === 100) {
            actions.refresh({id});
        }
    };
    
    const {request, cancel} = await Api.blacklab.uploadDocuments(id, docs, meta, onUploadProgress);
    mutations.uploadStart({id, cancel});
    
    request.finally(() => mutations.uploadComplete({id}));
    return request;
    
    // .then(({request, cancel}) => {

    //     request
    //     .finally()
    //     .then(response => mutations.uploadComplete({id, response}))
    //     .catch(error => {
    //         console.log('error during upload to corpus ' + id, error);
    //         mutations.uploadError({id, error});
    //     });
    // });
}, 'uploadDocuments');

const cancelUploadDocumentsAction = b.dispatch((context, {id, reason = ''}: {id: string, reason?: string}) => {
    const {[id]: uploadState } = context.state.uploads;
    if (uploadState && uploadState.cancel) {
        uploadState.cancel(reason);
        mutations.uploadComplete({id});
    }
}, 'uploadDocumentsCancel');

export const actions = {
    load: loadAction,
    refresh: refreshAction,
    uploadDocuments: uploadDocumentsAction,
    cancelUpload: cancelUploadDocumentsAction
};

export const get = {
    corpora: b.read(state => state.corpora, 'getCorpora'),
    networkError: b.read(state => state.error, 'getCorporaError'),
    uploads: b.read(state => state.uploads, 'getCorporaUploads'),
};

export default () => {/**/};
