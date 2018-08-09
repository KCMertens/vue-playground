import {getStoreBuilder} from 'vuex-typex';
import { Canceler } from 'axios';

import * as Api from '@/api';
import {RootState} from '@/store';

import { NormalizedIndex, ApiError } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

export type UploadState = {
    request: Promise<BLTypes.BLResponse>;
    /** Null unless an upload is currently ongoing */
    progress: number;
    /** Cancel an ongoing upload, null if no upload in progress */
    cancel: Canceler;
};

export type CorporaState = {
    /** Have we attempted to load the initial corpora at least once */
    initialized: boolean;
    /** All known corpora. Empty when uninitialized. May be stale when last request failed. */
    corpora: {
        [key: string]: {
            index: NormalizedIndex;
            upload: UploadState|null;
            refresh: Promise<NormalizedIndex>|null;
            // structure: BlTypes.IndexStructure; T0D0
        }|null;
    };
};

const initialState: CorporaState = {
    initialized: false,
    corpora: {},
};

// Same store builder instance as used by root store, so no 
// need to explicitly register the module. anywhere
const b = getStoreBuilder<RootState>().module('corpora', initialState);

const mutations = {
    corpora: b.commit((state, payload: NormalizedIndex[]) => {
        const oldCorpora = state.corpora;
        const newCorpora = {} as typeof state.corpora;
        
        payload.forEach(index => {
            newCorpora[index.id] = {
                // init all fields in case there's no index by this name in the previous state
                upload: null,
                refresh: null,
                // Overwrite the initialized fields 
                ...oldCorpora[index.id],
                index
            };
        });
        // Replace the entire corpora object to get rid of removed corpora
        state.initialized = true;
        state.corpora = newCorpora;
    }, 'setCorpora'),
    corpus: b.commit((state, payload: NormalizedIndex) => {
        state.corpora[payload.id] = {
             // init all fields in case there's no index by this name in the previous state
             upload: null,
             refresh: null,
             // Overwrite the initialized fields 
            ...state.corpora[payload.id],
            index: payload
        };
    }, 'setCorpus'),
    refreshStart: b.commit((state, {id, request}: {id: string, request: Promise<NormalizedIndex>}) => {
        const info = state.corpora[id];
        if (info) { info.refresh = request; }
    }, 'refreshStart'),
    refreshComplete: b.commit((state, payload: NormalizedIndex) => {
        const info = state.corpora[payload.id];
        if (info) { info.refresh = null; }
    }, 'refreshComplete'),

    // Uploads
    uploadStart: b.commit((state, {id, request, cancel}: 
        { id: string, request: Promise<BLTypes.BLResponse>, cancel: Canceler}) => {
        const info = state.corpora[id];
        if (info) {
            info.upload = {
                request,
                cancel,
                progress: 0,
            };
        }
    }, 'startUpload'),
    uploadProgress: b.commit((state, {id, progress}: { id: string, progress: number }) => {
        // Sometimes an event may come in in after the upload was cancelled
        const info = state.corpora[id];
        if (info && info.upload) {
            info.upload.progress = progress;
        }
    }, 'uploadProgress'),
    uploadComplete: b.commit((state, {id}: { id: string }) => {
        const info = state.corpora[id];
        if (info) { info.upload = null; }
    }, 'uploadComplete'),
};

const loadAction = b.dispatch(() => {
    const req = Api.blacklab.getCorpora();
    req.then(corpora => corpora.forEach(c => {
        if (c.indexProgress) {
            refreshAction({id: c.id});
        }
    }));

    req.then(mutations.corpora);
    return req;
}, 'load');


const refreshAction = b.dispatch((context, {id}: {id: string}) => {
    const info = context.state.corpora[id];
    if (info && info.refresh) {
        return info.refresh;
    }

    const request = Api.blacklab.getCorpus(id);
    mutations.refreshStart({id, request});
    request.then(mutations.corpus);
    request.finally(() => mutations.refreshComplete);
    return request;
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
    mutations.uploadStart({id, request, cancel});
    
    request.finally(() => mutations.uploadComplete({id}));
    return request;
}, 'uploadDocuments');

const cancelUploadDocumentsAction = b.dispatch((context, {id, reason = ''}: {id: string, reason?: string}) => {
    const info = context.state.corpora[id];
    if (info && info.upload) {
        info.upload.cancel(reason);
        mutations.uploadComplete({id});
    }
}, 'uploadDocumentsCancel');

const deleteIndexAction = b.dispatch((context, {id}: {id: string}) => {
    // TODO writing the modified list of indices marks them as initialized
    // even if it wasn't initialized before.
    if (!context.state.initialized) {
        return;
    }
    
    const request = Api.blacklab.deleteIndex(id);
    request.then(() => {
        mutations.corpora( // update corpora
            Object.values(context.state.corpora)
            .map(s => s!.index)  // get all current corpora
            .filter(i => i.id !== id) // remove the deleted one
        );
    });
}, 'deleteIndex');

export const actions = {
    load: loadAction,
    refresh: refreshAction,
    uploadDocuments: uploadDocumentsAction,
    cancelUpload: cancelUploadDocumentsAction,
    deleteCorpus: deleteIndexAction
};

export const get = {
    initialized: b.read(state => state.initialized, 'getInitialized'),
    corpora: b.read(state => state.corpora, 'getCorpora'),
    corpus: b.read(state => (id: string) => state.corpora[id], 'getCorpus'),
};

export default () => {/**/};
