import { getStoreBuilder } from 'vuex-typex';

import Vue from 'vue';

import {RootState as SuperRootState} from '@/store';

import * as api from '@/api';
import {swallowError} from '@/utils/apiutils';
import { NormalizedFormat } from '@/types/apptypes';

export type RootState = {
    initialized: boolean;
    formats: {
        // Never actually undefined when key exists, but aids with type checking
        [key: string]: NormalizedFormat|undefined;
    };
};

export const initialState: RootState = {
    initialized: false,
    formats: {},
};

// Same store builder instance as used by root store, so this module is implicitly registered
const b = getStoreBuilder<SuperRootState>().module<RootState>('formats', initialState);

const mutations = {
    setFormats: b.commit((state, payload: NormalizedFormat[]) => {
        const newFormats = {} as typeof state.formats;

        payload.forEach(format => {
            newFormats[format.id] = format;
        });
        state.formats = newFormats;
        state.initialized = true;
    }, 'setFormats'),
    removeFormat: b.commit((state, {id}: {id: string}) => {
        if (!state.initialized) {
            return;
        }
        Vue.delete(state.formats, id);
    }, 'removeFormat'),
    addFormat: b.commit((state, payload: NormalizedFormat) => {
        if (!state.initialized) {
            return;
        }
        Vue.set(state.formats, payload.id, payload);
    }, 'addFormat'),
};

export const actions = {
    load: b.dispatch(() => {
        const request = api.blacklab.getFormats();
        request.then(mutations.setFormats, swallowError);
        return request;
    }, 'loadFormats'),
    delete: b.dispatch((context, {id}: {id: string}) => {
        const request = api.blacklab.deleteFormat(id);
        request.then(() => mutations.removeFormat({id}), swallowError);
        return request;
    }, 'deleteFormat'),
};

export const get = {
    initialized: b.read(state => state.initialized, 'getInitialized'),
    formats: b.read(state => state.formats, 'getFormats'),
    format: b.read(state => (id: string) => state.formats[id], 'getFormat'),
};

export const init = (formats: NormalizedFormat[]) => {
    if (get.initialized()) {
        return;
    }

    mutations.setFormats(formats);
};
