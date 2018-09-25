"use strict";

const x = require('x-ray')().concurrency(10).delay(1000, 2000);

const Storage = require('@google-cloud/storage');
const storage = Storage();
const bucket = storage.bucket('www.mangamood.me');

const cloudscraper = require('cloudscraper');

x.driver(function driver(context, callback) {
    const url = context.url;

    cloudscraper.get(url, function (err, response, body) {
        if (err || (response.statusCode != 200 && response.statusCode != 404)) {
            console.error(err || response.statusCode);
            driver(context, callback);
            return;
        }

        callback(null, body);
    });
});

const animes = [];
const seen = {};

scrape(1);

function scrape(page) {
    x(`http://ww1.gogoanime.io/popular.html?page=${page}`, '.name a', [{
        title: '',
        info: x('a@href', {
            img: '.anime_info_body_bg img@src',
            id: '#movie_id@value'
        })
    }])(function (err, results) {
        if (err) {
            console.error(err);
            return;
        }

        if (!results.length) {
            console.error('Stopped at ' + page);

            if (!animes.length) {
                console.error('No animes!');
                return;
            }

            const gcsfile = bucket.file('animes.json');
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
                console.log('Uploaded animes.json');
            });

            stream.end(JSON.stringify(animes));
            return;
        }

        results = results.filter(function (result) {
            if (result.title.indexOf("r='0x'+a.") != -1) {
                return false;
            }

            result.title = result.title.replace(/\//g, '[SLASH]').trim();

            if (seen[result.title]) {
                return false;
            } else {
                seen[result.title] = true;
                return true;
            }
        });

        let i = 0;

        function doop() {
            if (i >= results.length) {
                i++;

                if (i == results.length + 10) {
                    scrape(page + 1);
                }
                return;
            }

            loop(results[i++], function (err, result) {
                if (!err) {
                    animes.push([result.title, result.info.img]);
                }
                doop();
            });
        }

        for (; i < 10;) {
            doop();
        }
    });
}

function loop(result, callback) {
    const {title, info} = result;
    const episodes = [];

    x(`http://ww1.gogoanime.io/load-list-episode?ep_start=0&ep_end=2000&id=${info.id}`, 'li a', [{
        episode: '.name',
        href: '@href'
    }])(function (err, results) {
        if (err || !results.length) {
            console.error(err || 'No results: '+ `http://ww1.gogoanime.io/load-list-episode?ep_start=0&ep_end=2000&id=${info.id}`);
            callback(true);
            return;
        }

        let length = results.length;
        function uploadIfConditionsMet() {
            if (episodes.length == length) {
                if (!episodes.length) {
                    callback(true);
                    return;
                }

                const gcsfile = bucket.file('animes/' + title + '.json');
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
                    callback(err);
                });

                stream.on('finish', function () {
                    console.log('Uploaded Anime - ' + title + '.json');
                    callback(null, result);
                });

                episodes.sort(function (a, b) {
                    const parsedA = parseFloat(a[0].replace('Episode ', ''));
                    const parsedB = parseFloat(b[0].replace('Episode ', ''));

                    if (isNaN(parsedA) && isNaN(parsedB)) {
                        return a[0].localeCompare(b[0]);
                    } else if (isNaN(parsedA) && !isNaN(parsedB)) {
                        return 1;
                    } else if (isNaN(parsedB) && !isNaN(parsedA)) {
                        return -1;
                    }

                    return parsedA - parsedB;
                });

                stream.end(JSON.stringify(episodes));
            }
        }

        results.forEach(function (result) {
            result.episode = result.episode.replace(' EP', 'Episode');
            x(result.href, 'a[data-video]', [{
                iframe: '@data-video',
                name:''
            }])(function (err, results) {
                if (err || !results.length) {
                    console.error(err || 'No results: '+ result.href);
                    length--;
                    uploadIfConditionsMet();
                    return;
                }

                episodes.push([result.episode, results.map(function (result) {
                    return [result.name.replace('Choose this server', '').trim(), result.iframe.replace('&w=686&h=385', '')];
                }).filter(function (result) {
                    return result[0] !== 'Mp4Upload' && result[0] !== 'Bestream';
                })]);
                uploadIfConditionsMet();
            });
        });
    });
}