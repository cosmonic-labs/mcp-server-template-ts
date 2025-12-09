// START_OF Features.Auth
// import { CallParams } from "./http_client";
// import { getUserFromUserToken, refreshAccessTokenIfNeeded } from "./users";

// export type ValidateAuthSuccess = void;
// export enum ValidateAuthError {
//     LoginRequired,
//     UserNotFound,
// }
// export type ValidateAuthResult = ValidateAuthSuccess | ValidateAuthError;

// /**
//  * Performs validation of authentication on a given call.
//  * On success, sets the Authorization header on params with the user's access token.
//  */
// export async function validateAuth(params: CallParams): Promise<ValidateAuthResult> {
//     if (!params.authorizationHeader) {
//         return ValidateAuthError.LoginRequired;
//     }
//     const user = getUserFromUserToken(params.authorizationHeader);
//     if (!user) {
//         return ValidateAuthError.UserNotFound;
//     }

//     const refreshResult = await refreshAccessTokenIfNeeded(user);
//     if (refreshResult && refreshResult.error) {
//         throw new Error("Failed to refresh access token");
//     }

//     if (!params.headers) {
//         params.headers = {};
//     }
//     params.headers.Authorization = `${user.token_type} ${user.access_token}`;
// }
// END_OF Features.Auth
