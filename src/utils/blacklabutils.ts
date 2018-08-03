import {NormalizedIndex} from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';

export function normalizeIndex(id: string, index: BLTypes.BLIndex): NormalizedIndex {
    return {
        id,
        owner: id.substring(0, id.indexOf(':')) || null,
        shortId: id.substr(id.indexOf(':') + 1),
        
        documentFormat: index.documentFormat || null,
        indexProgress: index.indexProgress || null,
        tokenCount: index.tokenCount == null ? null : index.tokenCount,

        ...index,
    };
}
