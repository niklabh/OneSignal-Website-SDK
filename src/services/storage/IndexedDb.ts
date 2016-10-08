///<reference path="../../../typings/globals/loglevel/index.d.ts"/>
import Storage from "./Storage";
import {Notification} from "../../models/Notification";
import {Url} from "url";


export class IndexedDb implements Storage {

    static instance: IDBDatabase;

    /**
     * Returns an existing instance or creates a new instances of the database.
     * @returns {Promise} Returns a promise that is fulfilled when the database becomes accessible or rejects when an error occurs.
     */
    static getInstance(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (IndexedDb.instance) {
                resolve(IndexedDb.instance);
            } else {
                let request = indexedDB.open("ONE_SIGNAL_SDK_DB", 1);
                
                request.onsuccess = ({target}) => {
                    let db = (<any>target);
                    if (IndexedDb.instance) {
                        db.close();
                        resolve(IndexedDb.instance);
                    } else {
                        IndexedDb.instance = db;
                        log.debug('Opening IndexedDB instance.');
                        resolve(db);
                    }
                };
                request.onerror = (event: any) => {
                    log.error('OneSignal: Unable to open IndexedDB.',
                              event.target.error.name + ': ' + event.target.error.message);
                    reject(event);
                };
                request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                    log.info('OneSignal: IndexedDB is being rebuilt or upgraded.', event);
                    let db = (<IDBOpenDBRequest>event.target).result;
                    db.createObjectStore("Ids", {
                        keyPath: "type"
                    });
                    db.createObjectStore("NotificationOpened", {
                        keyPath: "url"
                    });
                    db.createObjectStore("Options", {
                        keyPath: "key"
                    });
                };
                request.onblocked = (event) => {
                    log.warn('The database is about to be deleted.');
                };
            }
        });
    }

    /**
     * Asynchronously retrieves the value of the key at the table (if key is specified), or the entire table (if key is not specified).
     * @param table The table to retrieve the value from.
     * @param key The key in the table to retrieve the value of. Leave blank to get the entire table.
     * @returns {Promise} Returns a promise that fulfills when the value(s) are available.
     */
    static async get(table: string, key: string): Promise<any> {
        let db = await IndexedDb.getInstance();
        if (key) {
            // Return a table-key value
            return new Promise((resolve, reject) => {
                var request: IDBRequest = db.transaction(table).objectStore(table).get(key);
                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } else {
            // Return all values in table
            return new Promise((resolve, reject) => {
                let jsonResult = {};
                let cursor = db.transaction(table).objectStore(table).openCursor();
                cursor.onsuccess = (event: any) => {
                    var cursorResult: IDBCursorWithValue = event.target.result;
                    if (cursorResult) {
                        let cursorResultKey: any = cursorResult.key;
                        jsonResult[cursorResultKey] = cursorResult.value.value;
                        cursorResult.continue();
                    } else {
                        resolve(jsonResult);
                    }
                };
                cursor.onerror = (event) => {
                    reject(cursor.error);
                };
            });
        }
    }

    /**
     * Asynchronously puts the specified value in the specified table.
     * @param table
     * @param key
     */
    static async put(table: string, key: string): Promise<any> {
        let db = await IndexedDb.getInstance();
        return new Promise((resolve, reject) => {
            try {
                let request = db.transaction([table], 'readwrite').objectStore(table).put(key);
                request.onsuccess = (event) => {
                    resolve(key);
                };
                request.onerror = (e) => {
                    log.error('Database PUT Transaction Error:', e);
                    reject(e);
                };
            } catch (e) {
                log.error('Database PUT Error:', e);
                reject(e);
            }
        });
    }

    /**
     * Asynchronously removes the specified key from the table, or if the key is not specified, removes all keys in the table.
     * @returns {Promise} Returns a promise containing a key that is fulfilled when deletion is completed.
     */
    static async remove(table: string, key?: string): Promise<any> {
        if (key) {
            // Remove a single key from a table
            var method = "delete";
        } else {
            // Remove all keys from the table (wipe the table)
            var method = "clear";
        }
        let db = await IndexedDb.getInstance();
        return new Promise((resolve, reject) => {
            try {
                let request = db.transaction([table], 'readwrite').objectStore(table)[method](key);
                request.onsuccess = (event) => {
                    resolve(key);
                };
                request.onerror = (e) => {
                    log.error('Database REMOVE Transaction Error:', e);
                    reject(e);
                };
            } catch (e) {
                log.error('Database REMOVE Error:', e);
                reject(e);
            }
        });
    }

    /**
     * Asynchronously removes the Ids, NotificationOpened, and Options tables from the database and recreates them with blank values.
     * @returns {Promise} Returns a promise that is fulfilled when rebuilding is completed, or rejects with an error.
     */
    static async rebuild(): Promise<any> {
        return await Promise.all([
            IndexedDb.remove('Ids'),
            IndexedDb.remove('NotificationOpened'),
            IndexedDb.remove('Options'),
        ]);
    }
}