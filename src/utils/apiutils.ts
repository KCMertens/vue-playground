// import {mergeWith} from 'lodash-es';

import {ApiError} from '@/types/apptypes';
import { AxiosError, AxiosResponse } from '../../node_modules/axios';

const settings = {
    delay: 2500,
};

export function delayResponse<T>(r: T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(r), 2500);
    });
}

export function delayError<T>(e: AxiosError): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(e), 2500);
    });
}

/**
 * Maps network error and blacklab error to ApiError.
 * For use with axios. Always returns a rejected promise containing the error.
 *
 * @param response
 */
export async function handleError<T>(error: AxiosError): Promise<T> {
    
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

export function jsonRequest(url?: string) {
    const init: RequestInit = {
        mode: 'cors',
        headers: {
            Accept: 'Application/json; charset=utf-8',
        },
    };

    return slowFetch(url, init)
    .then(handleBlacklabError, handleNetworkError)
    .then(r => r.json());
}
