
const timeout = 5000;
function slowFetch(stuff?: string|Request, config?: RequestInit): Promise<Response> {
    return fetch(stuff, config).then(
        (r: Response) => new Promise<Response>((resolve, reject) => setTimeout(() => resolve(r), timeout)),
        (e) => new Promise<Response>((resolve, reject) => setTimeout(() => reject(e), timeout)));
}

export interface ApiError {
    title: string;
    message: string;
    /** http code, -1 if miscellaneous network error */
    status: number;
}

/**
 * If response.ok is true, returns the response as-is.
 *
 * If response.ok is false, attempts to read the body as BlackLab error and throws an ApiError.
 * If the response can't be read, throws a generic ApiError.
 *
 * @param response
 */
async function mapAndRejectErrors(response: Response): Promise<any> {
    if (response.ok) { // 200-299, should be a valid response, leave to caller to deserialize
        return response;
    }

    // Something else is going on, see if it's a blacklab error object
    try {
        const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
        if (contentType.includes('json')) {
            const json = await response.json();

            // TODO
            return Promise.reject({
                title: 'Some json error',
                message: 'Some json erorr',
                status: response.status,
            });
        } else if (contentType.includes('xml')) {
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, 'application/xml');

            // TODO
            return Promise.reject({
                title: 'Some xml error',
                message: 'Some xml error',
                status: response.status,
            });
        } else {
            return Promise.reject({
                title: 'Network error',
                message: 'Unknown reason.',
                status: response.status,
            });
        }
    } catch (error) {
        return Promise.reject({
            title: 'Unknown error',
            message: 'Received invalid response from ' + response.url,
            status: response.status,
        });
    }
}

export interface AppConfig {
    title: 'Corpus Frontend - vue';
}

export function getAppConfig(): Promise<AppConfig> {
    return slowFetch('/config/appconfig.json').then(mapAndRejectErrors).then((r) => r.json());
}
