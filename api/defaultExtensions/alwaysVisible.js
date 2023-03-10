module.exports = {
    code: () => {
        Object.defineProperty(window.document, 'hidden', {
            get: function () {
                return false;
            },
            configurable: true
        })
        Object.defineProperty(window.document, 'visibilityState', {
            get: function () {
                return 'visible';
            },
            configurable: true
        })
    },
    verify: () => true
}