import {getStoreBuilder} from 'vuex-typex';
import { Canceler } from 'axios';

import * as Api from '@/api';
import {swallowError} from '@/utils/apiutils';
import {RootState} from '@/store';

import { NormalizedIndex } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

export type UploadState = {
    request: Promise<BLTypes.BLResponse>;
    /** Null unless an upload is currently ongoing */
    progress: number;
    /** Cancel an ongoing upload, null if no upload in progress */
    cancel: Canceler;
};

export type CorpusState = {
    index: NormalizedIndex;
    upload: UploadState|null;
    refresh: Promise<NormalizedIndex>|null;
    // structure: BlTypes.IndexStructure; TODO
};

export type CorporaState = {
    /** Have we attempted to load the initial corpora at least once */
    initialized: boolean;
    /** All known corpora. Empty when uninitialized. May be stale when last request failed. */
    corpora: {
        // Never actually undefined when key exists, but aids with type checking
        [key: string]: CorpusState|undefined;
    };
};

const initialState: CorporaState = {
    initialized: false,
    corpora: {},
};

const initialCorpusState = {
    index: null,
    upload: null,
    refresh: null
};

// Same store builder instance as used by root store, so no 
// need to explicitly register the module. anywhere
const b = getStoreBuilder<RootState>().module('corpora', initialState);

const mutations = {
    corpora: b.commit((state, payload: NormalizedIndex[]) => {
        const oldCorpora = state.corpora;
        const newCorpora = {} as typeof oldCorpora;
        
        payload.forEach(index => {
            newCorpora[index.id] = {
                // Init in case it didn't exist yet
                ...initialCorpusState,
                // Write old state (if it existed) 
                ...oldCorpora[index.id],
                // Write updated fields
                index
            };
        });
        // Replace the entire corpora object to get rid of removed corpora
        state.initialized = true;
        state.corpora = newCorpora;
    }, 'setCorpora'),
    reloadCorpusStart: b.commit((state, {id, request}: {id: string, request: Promise<NormalizedIndex>}) => {
        const info = state.corpora[id];
        if (info) { info.refresh = request; }
    }, 'reloadCorpusStart'),
    reloadCorpusComplete: b.commit((state, {id, index}: {id: string, index?: NormalizedIndex}) => {
        const info = state.corpora[id];
        if (info) {
            info.index = index || info.index;
            info.refresh = null;
        }
    }, 'reloadCorpusComplete'),
    
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
    }), swallowError);

    req.then(mutations.corpora, swallowError);
    return req;
}, 'load');


const refreshAction = b.dispatch((context, {id}: {id: string}) => {
    const info = context.state.corpora[id];
    if (info && info.refresh) {
        return info.refresh;
    }

    const request = Api.blacklab.getCorpus(id);
    mutations.reloadCorpusStart({id, request});
    request.then(
        index => mutations.reloadCorpusComplete({id, index}),
        error => mutations.reloadCorpusComplete({id}) // no result since we failed
    );

    return request;
}, 'refresh');

const uploadDocumentsAction = b.dispatch(async (
    context, 
    {id, docs, meta}: {id: string, docs: FileList, meta?: FileList|null}
) => {
    const onUploadProgress = (progress: number) => {
        if (isNaN(progress)) {
            return;
        }
        
        mutations.uploadProgress({id, progress});
        if (progress === 100) {
            actions.refresh({id});
        }
    };
    
    const {request, cancel} = await Api.blacklab.postDocuments(id, docs, meta, onUploadProgress);
    mutations.uploadStart({id, request, cancel});
    request.catch(swallowError).finally(() => mutations.uploadComplete({id}));

    // Return the version where we didn't swallow the exception so the call site can properly handle it.
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
    const request = Api.blacklab.deleteIndex(id);
    request.then(() => {
        // TODO writing the modified list of indices marks them as initialized
        // even if it wasn't initialized before.
        if (context.state.initialized) {
            mutations.corpora( // update corpora
                Object.values(context.state.corpora)
                .map(s => s!.index)  // get all current corpora
                .filter(i => i.id !== id) // remove the deleted one
            );
        }
    }, swallowError);
    return request;
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
