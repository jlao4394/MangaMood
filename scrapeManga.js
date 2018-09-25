"use strict";

const x = require('x-ray')().concurrency(40);

const Storage = require('@google-cloud/storage');
const storage = Storage();
const bucket = storage.bucket('www.mangamood.me');

const got = require('got');

x.driver(function driver(context, callback) {
    const url = context.url;

    got(url).then(function ({body}) {
        callback(null, body);
    }).catch(function (err) {
        if (err.statusCode != 404) {
            console.error(err);
            driver(context, callback);
        } else {
            callback(null, err.response.body);
        }
    });
});

x('http://www.mangareader.net/popular', '.manga_name a', [{
    title: '',
    inner: x('a@href', {
        cover: '#mangaimg img@src',
        link: '#listing a@href'
    })
}]).paginate('#sp a:contains(">")@href')
(function (err, results) {
    if (err || !results.length) {
        console.error(err);
        return;
    }

    const mangas = [];

    const seen = {};
    results = results.filter(function (result) {
        result.title = result.title.trim().replace(/\//g, '[SLASH]');

        if (seen[result.title]) {
            return false;
        } else {
            seen[result.title] = true;
            mangas.push([result.title, result.inner.cover]);
            return true;
        }
    });

    let i = 0;

    function doop() {
        if (i >= results.length) {
            return;
        }
        loop(results[i++], doop);
    }

    for (; i < 10;) {
        doop();
    }

    const gcsfile = bucket.file('mangas.json');
    const stream = gcsfile.createWriteStream({
        metadata: {
            contentType: 'application/json',
            cacheControl: 'public, max-age=7200'
        },
        public: true,
        gzip: true,
        resumable: false
    });

    stream.on('error', function (err) {
        console.error(err);
    });

    stream.on('finish', function () {
        console.log('Uploaded mangas.json');
    });

    stream.end(JSON.stringify(mangas));
});

function loop({title, inner}, callback) {
    x(inner.link, 'body', [{
        imageLink: '#imgholder img@src',
        chapter: '#mangainfo h1',
        page: '#pageMenu option[selected]'
    }])
        .paginate('span.next a@href')
        (function (err, results) {
            if (err || !results.length) {
                console.error(err || inner.link + ': Nothing');
                callback();
                return;
            }

            const split = inner.link.split('/');
            const minusOne = split[split.length - 1] !== '0';

            const mangaJson = [];

            results.forEach(function (result) {
                if (!result.page) {
                    return;
                }

                const split = result.chapter.split(' ');
                let chapter = parseInt(split[split.length - 1]);

                if (minusOne) {
                    chapter--;
                }

                if (!mangaJson[chapter]) {
                    mangaJson[chapter] = [];
                }

                mangaJson[chapter][parseInt(result.page) - 1] = result.imageLink;
            });

            const gcsfile = bucket.file('mangas/' + title + '.json');
            const stream = gcsfile.createWriteStream({
                metadata: {
                    contentType: 'application/json',
                    cacheControl: 'public, max-age=7200'
                },
                public: true,
                gzip: true,
                resumable: false
            });

            stream.on('error', function (err) {
                console.error(err);
                callback();
            });

            stream.on('finish', function () {
                console.log('Uploaded Manga - ' + title + '.json');
                callback();
            });

            stream.end(JSON.stringify(mangaJson));
        });
}
