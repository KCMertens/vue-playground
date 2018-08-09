import axios, {AxiosRequestConfig} from 'axios';

import {createEndpoint} from '@/utils/apiutils';

import { AppConfig } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

import { normalizeIndex } from '@/utils/blacklabutils';


const appEndpoint = createEndpoint({
    url: '/',
});


// We're going to need this often, so just cache it.
const appConfig = appEndpoint.get<AppConfig>('/config/appConfig.json');

const blacklabEndpoint = appConfig.then(config => createEndpoint({
    baseURL: config.blacklabServer,
    params: {
        outputformat: 'json',
    },
}));


/**
 * App api
 */
export const app = {
    get config() { return appConfig; }
};


// Some blacklab-server request creators
const paths = {
    /*
        Stupid issue, sending a request to /blacklab-server redirects to /blacklab-server/
        Problem is, the redirect response is missing the CORS header
        so the browser doesn't allow the redirect.
        There doesn't seem to be a way to fix this in the server as the redirect
        is performed by the servlet container and runs before any application code.
        So ensure our requests end with a trailing slash to prevent the server from redirecting
    */
    root: () => './', 
    index: (indexId: string) => `${indexId}/`,
    indexStatus: (indexId: string) => `${indexId}/status/`,
    documentUpload: (indexId: string) => `${indexId}/docs/`,
    shares: (indexId: string) => `${indexId}/sharing/`,
};

/**
 * Blacklab api
 */
export const blacklab = {
    getCorpora: async () => (await blacklabEndpoint)
        .get<BLTypes.BLServer>(paths.root())
        .then(r => Object.entries(r.indices))
        .then(r => r.map(([id, index]: [string, BLTypes.BLIndex]) => normalizeIndex(id, index))),

    getCorpus: async (id: string) => (await blacklabEndpoint)
        .get<BLTypes.BLIndex>(paths.indexStatus(id))
        .then(r => normalizeIndex(id, r)),

    getShares: async (id: string) => (await blacklabEndpoint)
        .get<{'users[]': BLTypes.BLShareInfo}>(paths.shares(id))
        .then(r => r['users[]']),

    postShares: async (id: string, newShares: BLTypes.BLShareInfo) => (await blacklabEndpoint)
        .post<BLTypes.BLResponse>(paths.shares(id), undefined, {
            data: (() => {
                const data = new FormData();
                newShares
                .map(user => user.trim())
                .filter(user => user.length)
                .forEach(user => data.append('users[]', user));
            })(),
        }),

    deleteIndex: async (id: string) => (await blacklabEndpoint)
        .delete<BLTypes.BLResponse>(paths.index(id)),
    
    uploadDocuments: async (
        indexId: string, 
        docs: FileList, 
        meta?: FileList|null, 
        onProgress?: (percentage: number) => void
    ) => {
        const endpoint = await blacklabEndpoint;
        const formData = new FormData();
        for (let i = 0; i < (docs ? docs.length : 0); ++i) {
            formData.append('data', docs.item(i)!, docs.item(i)!.name);
        }
        for (let i = 0; i < (meta ? meta.length : 0); ++i) {
            formData.append('linkeddata', meta!.item(i)!, meta!.item(i)!.name);
        }

        const cancelToken = axios.CancelToken.source();
        return {
            request: endpoint.post<BLTypes.BLResponse>(paths.documentUpload(indexId), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (event: ProgressEvent) => {
                    if (onProgress) {
                        onProgress(event.loaded / event.total * 100);
                    }
                },
                cancelToken: cancelToken.token
            }),
            cancel: cancelToken.cancel
        };
    },
};
