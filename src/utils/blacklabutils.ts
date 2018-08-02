import {NormalizedIndex} from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

export function normalizeIndex(id: string, index: BLTypes.BLIndex): NormalizedIndex {
    return {
        ...index,
        id,
        shortId: id.substr(id.indexOf(':') + 1),
        documentFormat: index.documentFormat || '',
        canSearch: index.status === 'available',
        isBusy: index.status !== 'available' && index.status !== 'empty',
        isPrivate: id.indexOf(':') !== -1,
    };
}
