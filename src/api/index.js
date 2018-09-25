import Vue from "vue";
import VueResource from "vue-resource";

Vue.use(VueResource);

const cache = {};

let latestUrl;

export const get = function (filename, callback) {
    if (filename.startsWith('/')) {
        filename = filename.substr(1);
    }
    if (filename.endsWith('/')) {
        filename = filename.substr(0, filename.length - 1);
    }

    const url = 'http://www.mangamood.me/' + filename + '.json';

    if (cache[url]) {
        callback(null, cache[url]);
        return;
    }

    latestUrl = url;
    makeRequest(url, callback);
};

const makeRequest = function (url, callback) {
    Vue.http.get(url).then(function ({body}) {
        callback(null, body);
        cache[url] = body;
        setTimeout(function () {
            delete cache[url];
        }, 7200000);
    }).catch(function () {
        if (latestUrl !== url) {
            callback('Failed');
            return;
        }

        setTimeout(function () {
            makeRequest(url, callback);
        }, 1000);
    });
};