// START_OF Features.Auth
// import { Hono } from "hono";
// import { getOAuthRedirectUrl, onOAuthCallback } from "../../users";
// import { SERVER_BASE_PATH, OAUTH_REDIRECT_PATH } from "../../config";

// /** Escape HTML special characters to prevent XSS */
// function escapeHtml(str: string): string {
//     return str
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }

// export function setupRoutes(baseApp: Hono) {
//     const signupApp = new Hono();

//     signupApp.get("/signup", (c) => {
//         return c.redirect(getOAuthRedirectUrl());
//     });
    
//     signupApp.get(OAUTH_REDIRECT_PATH, async (c) => {
//         const code = c.req.query("code");
//         const error = c.req.query("error");
    
//         const result = await onOAuthCallback(code, error);
    
//         if ("error" in result) {
//             return c.html(`
//                 <h1>OAuth Error</h1>
//                 <p>Error: ${escapeHtml(result.error)}</p>
//                 <a href="/">Go back</a>
//             `);
//         }

//         return c.html(`
//             <h1>Successfully Connected!</h1>
//             <h2>User Token: ${escapeHtml(result.userToken)}</h2>
//             <p>Use the MCP server by sending the header <code>Authorization: ${escapeHtml(result.userToken)}</code> with every request.</p>
//         `);
//     });

//     baseApp.route(SERVER_BASE_PATH, signupApp);
// }
// END_OF Features.Auth
