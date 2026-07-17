// Bisty Bakery - shared API client
(function (window) {
    "use strict";

    // Local dev: match whatever hostname the page was loaded from (localhost vs
    // 127.0.0.1), otherwise the login cookie is set for one host and never sent
    // back on the other. Anywhere else (deployed), the frontend and backend are
    // on different hosts entirely, so point straight at the live backend.
    var isLocalDev = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    var API_BASE_URL = isLocalDev
        ? window.location.protocol + "//" + window.location.hostname + ":8000/api"
        : "https://drna-backend.onrender.com/api";

    function request(path, options) {
        options = options || {};
        var opts = {
            method: options.method || "GET",
            headers: Object.assign({}, options.json ? { "Content-Type": "application/json" } : {}, options.headers || {}),
            credentials: "include"
        };
        if (options.json) {
            opts.body = JSON.stringify(options.json);
        } else if (options.body) {
            opts.body = options.body;
        }

        return fetch(API_BASE_URL + path, opts).then(function (res) {
            if (!res.ok) {
                return res.json().catch(function () {
                    return { detail: "Request failed (" + res.status + ")" };
                }).then(function (err) {
                    throw new Error(err.detail || "Request failed (" + res.status + ")");
                });
            }
            if (res.status === 204) return null;
            return res.json();
        });
    }

    window.BistyAPI = {
        BASE_URL: API_BASE_URL,
        get: function (path) { return request(path); },
        post: function (path, json) { return request(path, { method: "POST", json: json }); },
        patch: function (path, json) { return request(path, { method: "PATCH", json: json }); },
        del: function (path) { return request(path, { method: "DELETE" }); },
        postForm: function (path, formData) {
            return request(path, { method: "POST", body: formData });
        },
        putForm: function (path, formData) {
            return request(path, { method: "PUT", body: formData });
        }
    };

    window.BistyAPI.imageUrl = function (imageUrl) {
        if (!imageUrl) return "img/product-1.jpg";
        if (imageUrl.indexOf("http") === 0 || imageUrl.indexOf("data:") === 0) return imageUrl;
        return API_BASE_URL.replace(/\/api$/, "") + imageUrl;
    };
})(window);
