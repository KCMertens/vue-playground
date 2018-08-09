export interface BLResponse {
    status: {
        code: string;
        message: string;
    };
}

export interface BLError {
    error: {
        code: string;
        message: string;
    };
}

export interface BLIndexProgress {
    /** Number of .xml files indexed in this indexing action so far. */
    filesProcessed: number;
    /** Number of documents finished in this indexing action so far. */
    docsDone: number;
    /** Number of tokens finished in this indexing action so far. */
    tokensProcessed: number;
}

// Optional values have the null type added as that allows us to 
// set them to null when they're missing.
export interface BLIndex {
    displayName: string;
    /** Only available when status === 'indexing' */
    /** key of a BLFormat */
    documentFormat?: string|null;
    indexProgress?: BLIndexProgress|null;
    /** status opening is currently unused, but should be treated as generally unavailable */
    status: ('empty'|'available'|'indexing'|'opening');
    timeModified: string;
    /** Number of tokens in this index (excluding those tokens added in any currently running indexing action). */
    tokenCount?: number|null;
}

export interface BLUser {
    loggedIn: boolean;
    /** Only available when loggedIn */
    id?: string;
    /** When !loggedIn: false, when loggedIn, true/false depending on whether user has hit the private corpora limit. */
    canCreateIndex: boolean;
}

/** Info about users an index is shared with, entries are usernames */
export type BLShareInfo = string[];

export interface BLCacheStatus {
    maxSizeBytes: number;
    maxNumberOfSearches: number;
    maxSearchAgeSex: number;
    sizeBytes: number;
    numberOfSearches: number;
}

export interface BLServer {
    blacklabBuildTime: string;
    blacklabVersion: string;
    indices: {
        [key: string]: BLIndex;
    };
    user: BLUser;
    helpPageUrl: string;
    cacheStatus?: BLCacheStatus; 
}

