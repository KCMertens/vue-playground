export interface BLIndexProgress {
    /** Number of .xml files indexed in this indexing action so far. */
    filesProcessed: number;
    /** Number of documents finished in this indexing action so far. */
    docsDone: number;
    /** Number of tokens finished in this indexing action so far. */
    tokensProcessed: number;
}

export interface BLIndex {
    displayName: string;
    /** status opening is currently unused, but should be treated as generally unavailable */
    status: ('empty'|'available'|'indexing'|'opening');
    /** Only available when status === 'indexing' */
    indexProgress?: BLIndexProgress;
    /** key of a BLFormat */
    documentFormat?: string;
    timeModified: string;
    /** Number of tokens in this index (excluding those tokens added in any currently running indexing action). */
    tokenCount?: number;
}

export interface BLUser {
    loggedIn: boolean;
    /** Only available when loggedIn */
    id?: string;
    /** When !loggedIn: false, when loggedIn, true/false depending on whether user has hit the private corpora limit. */
    canCreateIndex: boolean;
}

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
