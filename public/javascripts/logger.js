const isDev = window.isDev;

window.log = function (...args) {
    if (window.isDev) {
        console.log(...args);
    }
};