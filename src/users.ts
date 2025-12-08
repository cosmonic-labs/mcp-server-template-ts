// START_OF Features.Auth
// import { dynamicConfig, OAUTH_AUTHORIZATION_URL, OAUTH_TOKEN_URL } from "./config";
// import { Descriptor, ErrorCode } from "wasi:filesystem/types@0.2.6"
// import { getDirectories } from "wasi:filesystem/preopens@0.2.6";

// const USERS_FILE_PATH = "users.json";
// const USER_TOKENS_FILE_PATH = "user_tokens.json";

// class Database {
//     private root?: Descriptor;
//     private fdUsers?: Descriptor;
//     private fdUserTokens?: Descriptor;
//     private users?: Record<string, User>;
//     private userTokens?: Record<string, string>;

//     private directory(): Descriptor {
//         if (!this.root) {
//             const directories = getDirectories();
//             if (directories.length === 0) {
//                 throw new Error("No preopened directories found");
//             }
//             if (directories.length > 1) {
//                 console.log("Multiple preopened directories found, using the first one");
//             }
//             this.root = directories[0]![0];
//         }
//         return this.root!;
//     }

//     private fileExists(path: string): boolean {
//         try {
//             this.directory().statAt({}, path)
//         } catch (e) {
//             if ((e as ErrorCode) === "no-entry") {
//                 return false;
//             }
//             return false;
//         }
//         return true;
//     }

//     private openFile(path: string): Descriptor {
//         const alreadyExists = this.fileExists(path);
//         const file = this.directory().openAt({}, path, { create: true }, { read: true, write: true });
//         if (!alreadyExists) {
//             this.writeFile(file, "{}");
//         }
//         return file;
//     }
    
//     private readFile(file: Descriptor): string {
//         const size = file.stat().size;
//         const [data, _eof] = file.read(size, 0n);
//         const users = new TextDecoder().decode(data);
//         return users;
//     }
    
//     private writeFile(file: Descriptor, data: string) {
//         file.write(new TextEncoder().encode(data), 0n);
//     }

//     private getUsers(): Record<string, User> {
//         if (!this.users) {
//             this.fdUsers = this.openFile(USERS_FILE_PATH);
//             const contents = this.readFile(this.fdUsers);
//             const users = JSON.parse(contents) as Record<string, User>;
//             this.users = users;
//         }
//         return this.users!;
//     }
    
//     private getUserTokens(): Record<string, string> {
//         if (!this.userTokens) {
//             this.fdUserTokens = this.openFile(USER_TOKENS_FILE_PATH);
//             const contents = this.readFile(this.fdUserTokens);
//             const userTokens = JSON.parse(contents) as Record<string, string>;
//             this.userTokens = userTokens;
//         }
//         return this.userTokens!;
//     }

//     public getUserIdFromUserToken(userToken: string): string | undefined {
//         return this.getUserTokens()[userToken];
//     }

//     public getUserFromUserId(userId: string): User | undefined {
//         return this.getUsers()[userId];
//     }

//     public getUserFromUserToken(userToken: string): User | undefined {
//         const id = this.getUserIdFromUserToken(userToken);
//         if (id) {
//             return this.getUserFromUserId(id);
//         }
//         return undefined;
//     }

//     public addUser(user: User): string {
//         const userToken = generateToken();
//         this.getUsers()[user.id] = user;
//         this.getUserTokens()[userToken] = user.id;
//         this.writeFile(this.fdUsers!, JSON.stringify(this.getUsers()));
//         this.writeFile(this.fdUserTokens!, JSON.stringify(this.getUserTokens()));
//         return userToken;
//     }

//     public updateUser(user: User) {
//         this.getUsers()[user.id] = user;
//         this.writeFile(this.fdUsers!, JSON.stringify(this.getUsers()));
//     }
// }

// const database = new Database();

// interface OAuthTokenResponse {
//     access_token: string;
//     token_type: string;
//     refresh_token: string;
//     expires_in: number;
//     scope: string;
//     api_url: string;
// }

// export interface User {
//     id: string;
//     access_token: string;
//     refresh_token: string;
//     expires_at: Date;
//     token_type: string;
// }

// export function createUser(oAuthTokenResponse: OAuthTokenResponse): User {
//     return {
//         id: crypto.randomUUID(),
//         access_token: oAuthTokenResponse.access_token,
//         refresh_token: oAuthTokenResponse.refresh_token,
//         expires_at: new Date(
//             Date.now() + oAuthTokenResponse.expires_in * 1000,
//         ),
//         token_type: oAuthTokenResponse.token_type,
//     };
// }

// export function refreshedUsersAccessToken(user: User, oAuthTokenResponse: OAuthTokenResponse): void {
//     user.access_token = oAuthTokenResponse.access_token;
//     user.refresh_token = oAuthTokenResponse.refresh_token;
//     user.expires_at = new Date(
//         Date.now() + oAuthTokenResponse.expires_in * 1000,
//     );
//     user.token_type = oAuthTokenResponse.token_type;
// }

// export function getOAuthRedirectUrl(): URL {
//     const authUrl = new URL(OAUTH_AUTHORIZATION_URL);
//     authUrl.searchParams.set("response_type", "code");
//     authUrl.searchParams.set("client_id", dynamicConfig().CLIENT_ID);
//     authUrl.searchParams.set("redirect_uri", dynamicConfig().OAUTH_REDIRECT_URL);
//     return authUrl;
// }

// export type OAuthCallbackSuccess = {
//     user: User;
//     userToken: string;
// };
// export type OAuthCallbackError = {
//     error: string;
// };
// export type OAuthCallbackResult = OAuthCallbackSuccess | OAuthCallbackError;

// export async function onOAuthCallback(
//     code?: string,
//     error?: string,
// ): Promise<OAuthCallbackResult> {
//     if (error) {
//         return { error };
//     }

//     if (!code) {
//         return { error: "Missing authorization code" };
//     }

//     const response = await getOAuthAccessToken(
//         new URLSearchParams({
//             grant_type: "authorization_code",
//             code: code,
//             redirect_uri: dynamicConfig().OAUTH_REDIRECT_URL,
//         }),
//     );

//     if ("error" in response) {
//         return { error: response.error };
//     }

//     const user = createUser(response.oAuthTokenResponse);
//     const userToken = database.addUser(user);

//     return { user, userToken };
// }

// export type GetOAuthAccessTokenSuccess = {
//     oAuthTokenResponse: OAuthTokenResponse;
// };
// export type GetOAuthAccessTokenError = {
//     error: string;
// };
// export type GetOAuthAccessTokenResult =
//     | GetOAuthAccessTokenSuccess
//     | GetOAuthAccessTokenError;
// async function getOAuthAccessToken(
//     body: URLSearchParams,
// ): Promise<GetOAuthAccessTokenResult> {
//     const { CLIENT_ID, CLIENT_SECRET } = dynamicConfig();
//     const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

//     let response: Response;
//     try {
//         response = await fetch(OAUTH_TOKEN_URL, {
//             method: "POST",
//             headers: {
//                 "Authorization": `Basic ${auth}`,
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body: body.toString(),
//         });
//     } catch (e) {
//         return { error: (e as Error).message };
//     }

//     if (!response.ok) {
//         const error = await response.text();
//         return { error };
//     }

//     const data = await response.json() as OAuthTokenResponse;
//     return { oAuthTokenResponse: data };
// }

// export type RefreshAccessTokenIfNeededSuccess = void;
// export type RefreshAccessTokenIfNeededError = {
//     error: string;
// };
// export type RefreshAccessTokenIfNeededResult =
//     | RefreshAccessTokenIfNeededSuccess
//     | RefreshAccessTokenIfNeededError;
// export async function refreshAccessTokenIfNeeded(
//     user: User,
// ): Promise<RefreshAccessTokenIfNeededResult> {
//     if (user.access_token && user.expires_at && user.expires_at > new Date()) {
//         return { error: "Access token is still valid" };
//     }

//     if (!user.refresh_token) {
//         return { error: "No refresh token available." };
//     }

//     const response = await getOAuthAccessToken(
//         new URLSearchParams({
//             grant_type: "refresh_token",
//             refresh_token: user.refresh_token,
//         }),
//     );

//     if ("error" in response) {
//         return { error: response.error };
//     }

//     refreshedUsersAccessToken(user, response.oAuthTokenResponse);
//     database.updateUser(user);

//     return;
// }

// export function getUserIdFromUserToken(userToken: string): string | undefined {
//     return database.getUserIdFromUserToken(userToken);
// }

// export function getUserFromUserId(userId: string): User | undefined {
//     return database.getUserFromUserId(userId);
// }

// export function getUserFromUserToken(userToken: string): User | undefined {
//     return database.getUserFromUserToken(userToken);
// }

// function generateToken(): string {
//     const LENGTH = 60;
//     return (crypto.randomUUID() + crypto.randomUUID()).replaceAll("-", "").slice(0, LENGTH);
// }
// END_OF Features.Auth
