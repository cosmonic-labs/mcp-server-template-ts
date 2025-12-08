export * from "./constants.js";
// START_OF Features.Auth
// import { get } from "wasi:config/store@0.2.0-rc.1";
// END_OF Features.Auth

/* static config */
export const SERVER_BASE_PATH = "/v1";
export const MCP_SERVER_BASE_PATH = `${SERVER_BASE_PATH}/mcp`;
// START_OF Features.Auth
// export const OAUTH_REDIRECT_PATH = `/oauth/callback`;

// /* dynamic config */
// export interface DynamicConfig {
//     MCP_SERVER_BASE_URL: string;
//     CLIENT_ID: string;
//     CLIENT_SECRET: string;
//     OAUTH_REDIRECT_URL: string;
// }

// let cachedConfig: DynamicConfig | undefined;

// export function dynamicConfig(): DynamicConfig {
//     if (cachedConfig) {
//         return cachedConfig;
//     }

//     const missingConfigs: string[] = [];

//     const MCP_SERVER_BASE_URL = get("MCP_SERVER_BASE_URL");
//     if (!MCP_SERVER_BASE_URL) {
//         missingConfigs.push("MCP_SERVER_BASE_URL");
//     }
//     const CLIENT_ID = get("CLIENT_ID");
//     if (!CLIENT_ID) {
//         missingConfigs.push("CLIENT_ID");
//     }
//     const CLIENT_SECRET = get("CLIENT_SECRET");
//     if (!CLIENT_SECRET) {
//         missingConfigs.push("CLIENT_SECRET");
//     }

//     if (missingConfigs.length > 0) {
//         throw new Error(`Missing configurations: ${missingConfigs.join(", ")}`);
//     }

//     const OAUTH_REDIRECT_URL = MCP_SERVER_BASE_URL + SERVER_BASE_PATH + OAUTH_REDIRECT_PATH;

//     return {
//         MCP_SERVER_BASE_URL: MCP_SERVER_BASE_URL!,
//         CLIENT_ID: CLIENT_ID!,
//         CLIENT_SECRET: CLIENT_SECRET!,
//         OAUTH_REDIRECT_URL: OAUTH_REDIRECT_URL!,
//     };
// }
// END_OF Features.Auth
