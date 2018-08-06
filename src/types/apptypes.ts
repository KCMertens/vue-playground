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

export interface NormalizedIndex extends BLTypes.BLIndex {
    /** ID in the form username:indexname */
    id: string;
    /** username extracted */
    owner: string|null;
    /** indexname extracted */
    shortId: string;

    // These are now set to null if they were missing
    documentFormat: string|null;
    indexProgress: BLTypes.BLIndexProgress|null;
    tokenCount: number|null;
}
