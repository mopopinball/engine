/**
 * Common utilities.
 */
class Utils {
    /**
     * Returns a random item from the given collection.
     * Useful for playing a random sound, lighting a random light, etc.
     * @param {Array} collection A list to choose frome.
     * @return {*} A random item from the given collection.
     */
    static getRandom(collection) {
        const randomIndex = Utils.getRandomInteger(0, collection.length);
        return collection[randomIndex];
    }

    static getRandomPercentage(min, max) {
        return Utils.getRandomInteger(min, max + 1) / 100;
    }

    // Returns a random integer in the range [min, max).
    static getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    static isOneOf(item, collection) {
        if (!item || !collection || collection.length === 0) {
            return false;
        }

        return collection.find((candidate) => {
            return candidate === item;
        });
    }
}

module.exports = Utils;
