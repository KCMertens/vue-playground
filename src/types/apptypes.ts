import * as BLTypes from '@/types/blacklabtypes';

export class ApiError extends Error {
    public readonly title: string;
    public readonly message: string;
    /** http code, -1 if miscellaneous network error */
    public readonly code: number;

    constructor(title: string, message: string, status: number) {
        super();
        this.title = title;
        this.message = message;
        this.code = status;
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
    id: string;
    shortId: string;
    documentFormat: string;
    canSearch: boolean;
    isBusy: boolean;
    isPrivate: boolean;
}
