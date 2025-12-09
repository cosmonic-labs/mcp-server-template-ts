import { API_BASE_URL } from "./config";
// START_OF Features.Auth
// import { dynamicConfig, SERVER_BASE_PATH } from "./config";
// import { validateAuth, ValidateAuthError } from "./auth";

// /** Escape HTML special characters to prevent XSS */
// function escapeHtml(str: string): string {
//     return str
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }
// END_OF Features.Auth

export interface HTTPClientParams {
    baseUrl: string;
}

export interface CallParams {
    path: string;
    pathParams?: Record<string, string>;
    query?: Record<string, string>;
    method?: RequestInit['method'];
    headers?: Record<string, string>;
    body?: RequestInit['body'];
    // START_OF Features.Auth
    // authorizationHeader?: string;
    // END_OF Features.Auth
}

export class HTTPClient {
    private baseUrl: string;

    constructor(params: HTTPClientParams) {
        this.baseUrl = params.baseUrl;
    }

    public async call(params: CallParams): Promise<Response> {
        // START_OF Features.Auth
        // const validateAuthResult = await validateAuth(params);

        // const signupUrl = new URL(SERVER_BASE_PATH + "/signup", dynamicConfig().MCP_SERVER_BASE_URL);
        // if (validateAuthResult === ValidateAuthError.LoginRequired) {
        //     const body = `<p>Login required. Please visit <a href="${signupUrl}">${signupUrl}</a> to sign up.</p>`;
        //     return new Response(body, {
        //         status: 401,
        //         headers: {
        //             "Content-Type": "text/html",
        //         },
        //     });
        // } else if (validateAuthResult === ValidateAuthError.UserNotFound) {
        //     const body = `<h1>User not found</h1><p>Please sign up again at <a href="${signupUrl}">${signupUrl}</a></p>`;
        //     return new Response(body, {
        //         status: 401,
        //         headers: {
        //             "Content-Type": "text/html",
        //         },
        //     });
        // }
        // END_OF Features.Auth

        let path = params.path;
        for (const [key, value] of Object.entries(params.pathParams ?? {})) {
            path = path.replace(`{${key}}`, value);
        }
        console.assert(!path.includes('{'), `Not all path params were replaced in path: ${path}`);

        return fetch(`${this.baseUrl}${path}?${new URLSearchParams(params.query).toString()}`, {
            method: params.method,
            headers: params.headers,
            body: params.body,
        });
    }
}

export const httpClient = new HTTPClient({
    baseUrl: API_BASE_URL,
});
