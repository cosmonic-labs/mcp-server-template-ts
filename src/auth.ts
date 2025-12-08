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
//  *
//  * @throws {Error} if validation fails for any reason
//  */
// export async function validateAuth(params: CallParams): Promise<ValidateAuthResult> {
//     if (!params.authorizationHeader) {
//         return ValidateAuthError.LoginRequired;
//     }
//     const user = getUserFromUserToken(params.authorizationHeader);
//     if (!user) {
//         return ValidateAuthError.UserNotFound;
//     }

//     await refreshAccessTokenIfNeeded(user);

//     if (!params.headers) {
//         params.headers = {};
//     }
//     params.headers.Authorization = `${user.token_type} ${user.access_token}`;
// }
// END_OF Features.Auth
