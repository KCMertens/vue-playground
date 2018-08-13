import { getStoreBuilder } from 'vuex-typex';

import { RootState } from '@/store';

import * as api from '@/api';
import {swallowError} from '@/utils/apiutils';

import { NormalizedFormat } from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

export type FormatState = {
    initialized: boolean;
    formats: {
        // Never actually undefined when key exists, but aids with type checking
        [key: string]: NormalizedFormat|undefined;
    };
};

const initialState: FormatState = {
    initialized: false,
    formats: {},
};

// Same store builder instance as used by root store, so this module is implicitly registered
const b = getStoreBuilder<RootState>().module('formats', initialState);

const mutations = {
    setFormats: b.commit((state, payload: NormalizedFormat[]) => {
        const newFormats = {} as typeof state.formats;
        
        payload.forEach(format => {
            newFormats[format.id] = format;
        });
        state.formats = newFormats;
        state.initialized = true;
    }, 'setFormats'),
};

export const actions = {
    init: () => {/**/}, // future use
    load: b.dispatch((context, payload) => {
        const request = api.blacklab.getFormats();
        request.then(mutations.setFormats, swallowError);
        return request;
    }, 'loadFormats'),
};

export const get = {
    initialized: b.read(state => state.initialized, 'getInitialized'),
    formats: b.read(state => state.formats, 'getFormats'),
};

// export default () => {/**/};