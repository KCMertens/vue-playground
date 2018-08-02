import {mergeWith} from 'lodash-es';

import {ApiError} from '@/types/apptypes';

const settings = {
    debug: true,
    delay: 2500,
    throw: false,
};

function slowFetch(url?: string|Request, init?: RequestInit): Promise<Response> {
    const res = fetch(url, init);
    
    return !settings.debug ? res : res.then(
        (r: Response) => new Promise<Response>((resolve, reject) => setTimeout(() => resolve(r), settings.delay)),
        (e) => new Promise<Response>((resolve, reject) => setTimeout(() => reject(e), settings.delay)));
}

/**
 * If response.ok is true, returns the response as-is.
 *
 * If response.ok is false, attempts to read the body as BlackLab error and throws an ApiError.
 * If the response can't be read, throws a generic ApiError.
 *
 * @param response
 */
async function handleBlacklabError(response: Response): Promise<any> {
    if (settings.debug && settings.throw) {
        throw new ApiError('Api debugging error', 'Thrown for request ' + response.url, -1);
    }
    
    if (response.ok) { // 200-299, should be a valid response, leave to caller to deserialize
        return response;
    }

    // Something else is going on, assume it's a blacklab-server error
    try {
        const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
        if (contentType.includes('json')) {
            const json = await response.json();

            // TODO
            return Promise.reject(new ApiError(
                'Some blacklab error in json format.', 
                'Todo parse the error json error', 
                response.status));
        } else if (contentType.includes('xml')) {
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, 'application/xml');

            // TODO
            return Promise.reject(new ApiError(
                'Some blacklab error in xml format.', 
                'Todo parse the error json error', 
                response.status));
        } else {
            return Promise.reject(new ApiError(
                'Unknown network error.', 
                `Could not determine response type from ${response.url}`, 
                response.status));
        }
    } catch (error) {
        return Promise.reject(new ApiError(
            'Unknown network error.', 
            `Receive invalid response from ${response.url}`, 
            response.status));
    }
}

async function handleNetworkError(error: Error) {
    throw new ApiError(
        `Network error`,
        `Could not connect to server: ${error.message}`,
        -4);
}

export function jsonRequest(url?: string, init?: RequestInit) {
   
    init = mergeWith({}, init, {
        mode: 'cors', 
        headers: {
            Accept: 'Application/json; charset=utf-8',
        },
    });
   
    return slowFetch(url, init)
    .then(handleBlacklabError, handleNetworkError)
    .then(r => r.json());
}
