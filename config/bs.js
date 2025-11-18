module.exports = {
    proxy: "http://localhost:3000",
    port: 4000,
    files: [
        "public/**/*.*",
        "views/**/*.hbs",
        "views/**/*.html",
        "routes/**/*.js"
    ],
    watch: true,
    open: false,
    notify: false,
};
