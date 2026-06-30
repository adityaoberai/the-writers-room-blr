/**
 * Thin, typed-enough data-access helpers over Appwrite TablesDB, all bound to the
 * project database and executed with the admin client. Returns are normalised so
 * callers always see `{ total, rows }` from list operations.
 */
import { adminTablesDB, Query } from './appwrite.js';
import { DATABASE_ID } from '$lib/constants.js';

const db = () => adminTablesDB();

export async function listRows(tableId, queries = []) {
	const res = await db().listRows({ databaseId: DATABASE_ID, tableId, queries });
	return { total: res.total ?? 0, rows: res.rows ?? res.documents ?? [] };
}

export async function getRow(tableId, rowId) {
	return db().getRow({ databaseId: DATABASE_ID, tableId, rowId });
}

/** Get a row, returning null instead of throwing when it does not exist. */
export async function tryGetRow(tableId, rowId) {
	try {
		return await getRow(tableId, rowId);
	} catch (err) {
		if (err?.code === 404) return null;
		throw err;
	}
}

export async function createRow(tableId, rowId, data) {
	return db().createRow({ databaseId: DATABASE_ID, tableId, rowId, data });
}

export async function updateRow(tableId, rowId, data) {
	return db().updateRow({ databaseId: DATABASE_ID, tableId, rowId, data });
}

export async function deleteRow(tableId, rowId) {
	return db().deleteRow({ databaseId: DATABASE_ID, tableId, rowId });
}

/** Count rows matching a query without fetching them all. */
export async function countRows(tableId, queries = []) {
	const res = await db().listRows({
		databaseId: DATABASE_ID,
		tableId,
		queries: [...queries, Query.limit(1)]
	});
	return res.total ?? 0;
}

/** Fetch every row matching the query, paging past the 100-row API ceiling. */
export async function listAllRows(tableId, queries = [], pageSize = 100) {
	const out = [];
	let cursor = null;
	for (let i = 0; i < 100; i++) {
		const page = [...queries, Query.limit(pageSize)];
		if (cursor) page.push(Query.cursorAfter(cursor));
		const res = await db().listRows({ databaseId: DATABASE_ID, tableId, queries: page });
		const rows = res.rows ?? res.documents ?? [];
		out.push(...rows);
		if (rows.length < pageSize) break;
		cursor = rows[rows.length - 1].$id;
	}
	return out;
}

export { Query };
