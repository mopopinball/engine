/**
 * a promise delay for debouncing.
 */
class DelayPromise {
    static delay(ms) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }
}

module.exports = DelayPromise;
