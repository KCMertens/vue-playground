export class ApiError extends Error {
    public readonly title: string;
    public readonly message: string;
    /** http code, -1 if miscellaneous network error */
    public readonly status: number;

    constructor(title: string, message: string, status: number) {
        super();
        this.title = title;
        this.message = message;
        this.status = status;
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
        links: NavLink[],
    };
}
