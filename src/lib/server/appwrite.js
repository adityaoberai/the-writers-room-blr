/**
 * Appwrite client factories for server-side use.
 *
 * Two kinds of clients:
 *  - admin client (API key): a reusable singleton with elevated scopes. Used for
 *    all privileged database/storage/user operations and for the auth token flow.
 *  - session client (cookie secret): created per request so it acts strictly on
 *    behalf of the logged-in user (used to validate the session via `account.get`).
 */
import {
	Client,
	TablesDB,
	Users,
	Storage,
	Account,
	ID,
	Query,
	Permission,
	Role
} from 'node-appwrite';
import { env } from '$env/dynamic/private';

export const APPWRITE_ENDPOINT = env.APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = env.APPWRITE_API_KEY;

/** httpOnly cookie that stores the Appwrite session secret. */
export const SESSION_COOKIE = 'tw_session';

function baseClient() {
	return new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

let _adminClient;
function adminClient() {
	if (!_adminClient) _adminClient = baseClient().setKey(APPWRITE_API_KEY);
	return _adminClient;
}

export const adminTablesDB = () => new TablesDB(adminClient());
export const adminUsers = () => new Users(adminClient());
export const adminStorage = () => new Storage(adminClient());
/** Account service bound to the admin client, used to mint email tokens and sessions. */
export const adminAccount = () => new Account(adminClient());

/** A per-request Account service that authenticates with the user's session secret. */
export function sessionAccount(secret, userAgent) {
	const client = baseClient().setSession(secret);
	if (userAgent) client.setForwardedUserAgent(userAgent);
	return new Account(client);
}

export { ID, Query, Permission, Role };
