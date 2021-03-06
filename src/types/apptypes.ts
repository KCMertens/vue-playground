import * as BLTypes from '@/types/blacklabtypes';

export class ApiError extends Error {
    public readonly title: string;
    public readonly message: string;
    /** http code, -1 if miscellaneous network error */
    public readonly statusText: string;

    constructor(title: string, message: string, statusText: string) {
        super();
        this.title = title;
        this.message = message;
        this.statusText = statusText;
    }
}

export interface NavLink {
    href: string;
    /** text to display */
    label?: string;
    /** icon classes */
    icon?: string;
    active?: boolean;
    /** does the link stay on the page (use vue-router) or is it external */
    local?: boolean;
}

export interface AppConfig {
    title: string;
    navbar: {
        links: NavLink[];
    };
    /** Url to blacklab-server, with optional port suffix (localhost:8080) */
    blacklabServer: string;
}

// -----------------------
// Blacklab derived types
// -----------------------

// Helper - get all props in A not in B
type Subtract<A, B> = Pick<A, Exclude<keyof A, keyof B>>;

interface NormalizedIndex_ {
    // new props
    /** ID in the form username:indexname */
    id: string;
    /** username extracted */
    owner: string|null;
    /** indexname extracted */
    shortId: string;

    // original props, with normalized values
    documentFormat: string|null;
    indexProgress: BLTypes.BLIndexProgress|null;
    tokenCount: number|null;
}
export type NormalizedIndex = NormalizedIndex_ & Subtract<BLTypes.BLIndex, NormalizedIndex_>;

interface NormalizedFormat_ {
    // new props
    id: string;
    /** Username extracted */
    owner: string|null;
    /** internal name extracted */
    shortId: string;
    
    // original props, with normalized values
    /** Null if would be empty originally */
    helpUrl: string|null;
    /** Null if would be empty originally */
    description: string|null;
    /** set to shortId if originally empty */
    displayName: string;
}
export type NormalizedFormat = NormalizedFormat_ & Subtract<BLTypes.BLFormat, NormalizedFormat_>;
