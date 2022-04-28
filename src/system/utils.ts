/**
 * Common utilities.
 */
export class Utils {
    /**
     * Returns a random item from the given collection.
     * Useful for playing a random sound, lighting a random light, etc.
     * @param {Array} collection A list to choose frome.
     * @return {*} A random item from the given collection.
     */
    static getRandom<T>(collection: T[]): T {
        const randomIndex = Utils.getRandomInteger(0, collection.length);
        return collection[randomIndex];
    }

    static getRandomPercentage(min: number, max: number): number {
        return Utils.getRandomInteger(min, max + 1) / 100;
    }

    // Returns a random integer in the range [min, max).
    static getRandomInteger(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    static isOneOf<T>(item: T, collection: T[]): boolean {
        if (!item || !collection || collection.length === 0) {
            return false;
        }

        return collection.find((candidate) => {
            return candidate === item;
        }) != null;
    }
}
