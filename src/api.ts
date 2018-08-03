import {ApiError, AppConfig} from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

import {normalizeIndex} from '@/utils/blacklabutils';
import {jsonRequest} from '@/utils/apiutils';

// We're going to need this often, so just cache it.
const appConfig: Promise<AppConfig> = jsonRequest('/config/appconfig.json');

/**
 * App api
 */
export const app = {
    getConfig(): Promise<AppConfig> {
        return appConfig;
    },
};

// Some blacklab-server request creators
const paths = app.getConfig().then(({blacklabServer: server}) => {
    if (!server || server.endsWith('/')) {
        throw new ApiError(
            'Invalid appConfig', 
            `Invalid blacklab-server path '${server}' - path must exist and not end in '/'`, 
            -2);
    }

    return {
        root: () => `${server}/`,
    };
});

/**
 * Blacklab api
 */
export const blacklab = {
    getCorpora: async () => 
        jsonRequest((await paths).root())
        .then((r: BLTypes.BLServer) => Object.entries(r.indices))
        .then(r => r.map(([id, index]: [string, BLTypes.BLIndex]) => normalizeIndex(id, index))),
};
