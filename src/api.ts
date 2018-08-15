import axios from 'axios';
import * as qs from 'qs';

import {createEndpoint, swallowError} from '@/utils/apiutils';

import { AppConfig, ApiError } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

import { normalizeIndex, normalizeFormat } from '@/utils/blacklabutils';


const appEndpoint = createEndpoint({
    url: '/',
});

/**
 * App api
 */
export const app = {
    getConfig: () => appEndpoint.get<AppConfig>('/config/appConfig.json'),
};

// If this fails, user will have to reload the page unfortunately
// We can't easily retry in case of a failed initial setup.
const blacklabEndpoint = app.getConfig().then(config => createEndpoint({
    baseURL: config.blacklabServer,
    params: {
        outputformat: 'json',
    },
}))
.catch(() => new Promise<never>((resolve, reject) => reject(new ApiError(
`Please reload the page.`,
`Failed to start up because /config/appConfig.json is missing on the server.
Please correct this and reload the page to try again.`, '')
)));

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
    root: () =>                             './',
    index: (indexId: string) =>             `${indexId}/`,
    indexStatus: (indexId: string) =>       `${indexId}/status/`,
    documentUpload: (indexId: string) =>    `${indexId}/docs/`,
    shares: (indexId: string) =>            `${indexId}/sharing/`,
    formats: () =>                          `input-formats/`,
    formatContent: (id: string) =>          `input-formats/${id}/`,
    formatXslt: (id: string) =>             `input-formats/${id}/xslt`,
};

/**
 * Blacklab api
 */
export const blacklab = {
    getServerInfo: async () => (await blacklabEndpoint)
        .get<BLTypes.BLServer>(paths.root()),

    getUser: async () => (await blacklabEndpoint)
        .get<BLTypes.BLServer>(paths.root())
        .then(r => r.user),

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

    getFormats: async () => (await blacklabEndpoint)
        .get<BLTypes.BLFormats>(paths.formats())
        .then(r => Object.entries(r.supportedInputFormats))
        .then(r => r.map(([id, format]: [string, BLTypes.BLFormat]) => normalizeFormat(id, format))),

    getFormatContent: async (id: string) => (await blacklabEndpoint)
        .get<BLTypes.BLFormatContent>(paths.formatContent(id)),

    getFormatXslt: async (id: string) => (await blacklabEndpoint)
        .get<string>(paths.formatXslt(id)),


    postShares: async (id: string, users: BLTypes.BLShareInfo) => (await blacklabEndpoint)
        .post<BLTypes.BLResponse>(paths.shares(id),
            // Need to manually set content-type due to long-standing axios bug
            // https://github.com/axios/axios/issues/362
            qs.stringify({users: users.map(u => u.trim()).filter(u => u.length)}, {arrayFormat: 'brackets'}),
            {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}}
        ),

    postFormat: async (name: string, contents: string) => {
        const endpoint = await blacklabEndpoint;
        const data = new FormData();
        data.append('data', new File([contents], name, {type: 'text/plain'}), name);
        return endpoint.post<BLTypes.BLResponse>(paths.formats(), data);
    },

    postCorpus: async (id: string, displayName: string, format: string) => (await blacklabEndpoint)
        .post(paths.root(),
            qs.stringify({name: id, display: displayName, format}),
            {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}}
        ),

    postDocuments: async (
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

    deleteFormat: async (id: string) => (await blacklabEndpoint)
        .delete<BLTypes.BLResponse>(paths.formatContent(id)),

    deleteCorpus: async (id: string) => (await blacklabEndpoint)
        .delete<BLTypes.BLResponse>(paths.index(id)),
};
