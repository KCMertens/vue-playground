import axios, {AxiosTransformer, AxiosRequestConfig, AxiosError} from 'axios';

import {delayResponse, delayError, handleBlacklabError} from '@/utils/apiutils';

import { ApiError, AppConfig, NormalizedIndex } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

import { normalizeIndex } from '@/utils/blacklabutils';
import { jsonRequest } from '@/utils/apiutils';

// We're going to need this often, so just cache it.
const appConfig: Promise<AppConfig> = jsonRequest('/config/appconfig.json');

// TODO we probably need to allow for logging in by adding some cookie or header or something?
const blacklabEndpoint = appConfig.then(config => axios.create({
    baseURL: config.blacklabServer,
    // transformResponse: (axios.defaults.transformResponse as AxiosTransformer[])
    //     .concat(delayResponse, handleBlacklabError),
    
    params: {
        outputformat: 'json',
    },
}));




/**
 * App api
 */
export const app = {
    getConfig(): Promise<AppConfig> {
        return appConfig;
    },
};

// Some blacklab-server request creators
const paths = {
    /*
        Stupid issue, sending a request to /blacklab-server redirects to /blacklab-server/
        Problem is, the redirect response is missing the CORS header
        so the browser doesn't allow the redirect.
        There doesn't seem to be a way to fix this in the server as the redirect
        is performed by the servlet container and runs before any application code.
        Therefor, ensure our requests end with a trailing slash...
    */
    root: () => './', 
    documentUpload: (indexId: string) => `${indexId}/docs/`,
};


/**
 * Blacklab api
 */
export const blacklab = {
    getCorpora: async () => {
        const endpoint = await blacklabEndpoint;
     
        return endpoint.get<BLTypes.BLServer>(paths.root())
        .then(delayResponse, delayError)
        .then(r => Object.entries(r.data.indices)
        .then(r => )
            
            
        //     , delayError)
        // .map(([id, index]: [string, BLTypes.BLIndex]) => normalizeIndex(id, index));
        // .catch(handleBlacklabError)



        // console.log(r);
        

        // (await blacklabEndpoint).get<BLTypes.BLServer>(paths.root())
        // .then(r => Object.entries(r.data.indices))
        // .then(r => r.map(([id, index]: [string, BLTypes.BLIndex]) => normalizeIndex(id, index))),
    },
        
        // .then(r => r.data),

    uploadDocuments: async (
        indexId: string, 
        docs: FileList, 
        meta?: FileList|null, 
        onProgress?: (percentage: number) => void) => {

        const endpoint = await blacklabEndpoint;
        const formData = new FormData();
        for (let i = 0; i < (docs ? docs.length : 0); ++i) {
            formData.append('data', docs.item(i)!, docs.item(i)!.name);
        }
        for (let i = 0; i < (meta ? meta.length : 0); ++i) {
            formData.append('linkeddata', meta!.item(i)!, meta!.item(i)!.name);
        }
        
        return endpoint.post(paths.documentUpload(indexId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: event => {
                if (onProgress) {
                    onProgress(event.loaded / event.total * 100);
                }
            },
        });
    },
};
