/**
 * @file idbModule.js
 * This file provides a Promise-based API for interacting with IndexedDB,
 * intended for use in a React environment (ES Modules).
 *
 * Database: "CostManagerDB" (version 1)
 * Object Store: "costs"
 *   - keyPath: "id" (autoIncrement)
 *   - sum, category, description, date (string in YYYY-MM-DD format)
 *   - indexes: "byDate", "byCategory"
 *
 * Exports:
 *   addCost(costData): Promise<number>
 *   getCostsForMonth(month, year): Promise<Array<object>>
 *   getCostsForYear(year): Promise<Array<object>>
 *   getLastNItems(n): Promise<Array<object>>
 *   deleteCost(id): Promise<void>
 *
 * Example usage:
 *   import { addCost, getCostsForMonth } from './idbModule.js';
 *   await addCost({ sum: 100, category: 'Food', description: 'Pizza', date: '2025-01-15' });
 *   const costs = await getCostsForMonth(1, 2025);
 */

const DB_NAME = 'CostManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'costs';

/**
 * Opens (or creates) the IndexedDB database, returning a Promise for the database instance.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        // Handle upgrades and initial creation of the database
        request.onupgradeneeded = (event) => {
            // The database did not previously exist, so create the object store
            const db = event.target.result;
            // Create the "costs" object store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                // Create indexes for sorting and filtering
                store.createIndex('byDate', 'date', { unique: false });
                store.createIndex('byCategory', 'category', { unique: false });
            }
        };

        // Handle successful database opening
        request.onsuccess = () => {
            resolve(request.result);
        };

        // Handle errors during database opening
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Adds a new cost record to the "costs" store.
 * @param {{ sum: number, category: string, description: string, date: string }} costData
 *  - sum: numeric amount of the cost
 *  - category: e.g., "Food", "Rent", "Entertainment"
 *  - description: extra info about the cost
 *  - date: string in YYYY-MM-DD format
 * @returns {Promise<number>} Promise resolving to the auto-generated ID of the new record.
 */
export async function addCost(costData) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        // Add the new record to the object store
        const request = store.add(costData);

        request.onsuccess = () => {
            resolve(request.result); // The new record's ID
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Retrieves all cost records that match a given month and year.
 * @param {number} month - 1-12
 * @param {number} year - four-digit year (e.g., 2025)
 * @returns {Promise<Array<object>>} Array of cost objects matching the date filter.
 */
export async function getCostsForMonth(month, year) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        // Get all cost records
        const request = store.getAll();

        request.onsuccess = () => {
            const allCosts = request.result;
            // Sort by date
            allCosts.sort((a, b) => new Date(a.date) - new Date(b.date));
            // Filter by the specified month and year
            const filtered = allCosts.filter((cost) => {
                const d = new Date(cost.date);
                return (d.getMonth() + 1 === month && d.getFullYear() === year);
            });
            resolve(filtered);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Retrieves all cost records for a given year.
 * @param year
 * @returns {Promise<Array<object>>} Array of cost objects for the specified year.
 * */
export async function getCostsForYear(year) {
    const db = await openDB(); // your open DB logic
    const tx = db.transaction('costs', 'readonly');
    const store = tx.objectStore('costs');

    return new Promise((resolve, reject) => {
        // Get all cost records
        const request = store.getAll();

        request.onsuccess = () => {
            const allCosts = request.result;
            // Sort by date
            allCosts.sort((a, b) => new Date(a.date) - new Date(b.date));
            // Filter by the specified year
            const filtered = allCosts.filter((item) => {
                const d = new Date(item.date);
                return d.getFullYear() === year;
            });
            resolve(filtered);
        };
        request.onerror = () => reject(request.error);
    });
}


/**
 * Returns an array of the last N items added, sorted descending by date or ID.
 * Example: sort by 'id' descending (assuming 'id' auto-increments).
 * @param {number} n - Number of items to retrieve
 * @returns {Promise<Array<object>>} Array of the last N items
 */
export async function getLastNItems(n = 15) {
    const db = await openDB(); // your openDB function
    const tx = db.transaction('costs', 'readonly');
    const store = tx.objectStore('costs');

    return new Promise((resolve, reject) => {
        // Get all cost records
        const request = store.getAll();

        request.onsuccess = () => {
            let allCosts = request.result;
            // Sort by date
            allCosts.sort((a, b) => new Date(a.date) - new Date(b.date));
            // Take the first N items
            const lastN = allCosts.slice(0, n);
            resolve(lastN);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Deletes a cost record by its ID.
 * @param {number} id - The primary key of the record to delete.
 * @returns {Promise<void>}
 */
export async function deleteCost(id) {
    const db = await openDB(); // your openDB function
    const tx = db.transaction('costs', 'readwrite');
    const store = tx.objectStore('costs');

    return new Promise((resolve, reject) => {
        // Delete the record with the given ID
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}


