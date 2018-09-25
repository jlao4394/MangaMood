<template>
    <div>
        <div v-if="isAnime" id="anime-div" ref="animeDiv">
            <div v-if='!manga' class="text-center">
                <spinner name="dots" :size="40"></spinner>
            </div>
            <iframe v-else :src="iframe" id="iframe" referrerpolicy="no-referrer" frameborder="0" allowfullscreen scrolling="no" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
        <div v-show="!isAnime" class='text-center non-selectable' @click='tap'>
            <div v-if='!loaded' class="text-center">
                <spinner name="dots" :size="40"></spinner>
            </div>
            <div v-show='loaded' ref='imgContainer' class='relative-position overflow-hidden'>
                <img :src='src' ref='img' v-touch-pan='pan' draggable="false" class='main-image'
                     :class='{"mobile-image": isMobile}'>
                <img :src='src' v-if='isMobile' ref='zoom' class='zoom' draggable="false">
            </div>
        </div>
    </div>
</template>

<script>
    import {Platform, AppFullscreen} from 'quasar';
    import {get} from '../api/index';

    export default {
        data () {
            return {
                manga: null,
                loaded: false
            }
        },
        computed: {
            src() {
                if (this.isAnime || !this.manga || !this.$route.params.page) {
                    return;
                }

                return this.manga[this.$route.params.chapter - 1][this.$route.params.page - 1];
            },
            isMobile() {
                return Platform.has.touch;
            },
            isAnime() {
                return this.$route.path.indexOf('/animes') != -1;
            },
            iframe() {
                return this.manga.find((episode) => episode[0] === this.$route.params.chapter)[1].find((source) => source[0] === this.$route.params.page)[1];
            }
        },
        methods: {
            tap(e) {
                if (!this.loaded || !this.$route.params.page || this.isAnime) {
                    return;
                }

                let left = false;

                if (!e.key) {
                    const x = e.x;
                    const windowWidth = window.innerWidth;

                    if (x < windowWidth / 2) {
                        left = true;
                    }
                } else if (e.key === 'ArrowLeft') {
                    left = true;
                } else if (e.key !== 'ArrowRight') {
                    return;
                }

                let chapter = this.$route.params.chapter;
                let page = this.$route.params.page;

                if (left) {
                    if (page == 1) {
                        chapter--;
                        if (chapter == 0) {
                            this.$router.push('/mangas/' + this.$route.params.manga + '/1');
                            return;
                        }

                        page = this.manga[chapter - 1].length;
                    } else {
                        page--;
                    }
                } else {
                    if (page == this.manga[chapter - 1].length) {
                        chapter++;

                        if (chapter > this.manga.length) {
                            this.$router.push('/mangas/' + this.$route.params.manga + '/' + Math.ceil(chapter / 25));
                            return;
                        }

                        page = 1;
                    } else {
                        page++;
                    }
                }

                if (!this.nextLoaded) {
                    this.loaded = false;
                } else {
                    this.$el.scrollTop = 0;
                }
                this.$router.push('/mangas/' + this.$route.params.manga + '/' + chapter + '/' + page);
            },
            pan(e) {
                if (!this.isMobile) {
                    return;
                }

                const zoom = this.$refs.zoom;
                const img = this.$refs.img;

                if (e.isFirst) {
                    zoom.style.opacity = 1;
                    this.initialPosition = e.position;
                    this.xRatio = -((zoom.width - img.width) / img.width);
                    this.yRatio = -((zoom.height - img.height) / img.height);
                } else if (e.isFinal) {
                    zoom.style.opacity = 0;
                    return;
                }

                const leftDistance = (e.position.left - this.initialPosition.left);
                const topDistance = (e.position.top - this.initialPosition.top);

                let left = e.position.left - img.offsetLeft + leftDistance * 2;
                let top = e.position.top - 69 + this.$el.scrollTop + topDistance * 2;

                left = Math.max(Math.min(left, img.width), 0);
                top = Math.max(Math.min(top, img.height), 0);

                const imgContainer = this.$refs.imgContainer;

                zoom.style.left = left * this.xRatio + (imgContainer.clientWidth - img.width) / 2 + 'px';
                zoom.style.top = top * this.yRatio + 'px';
            }
        },
        beforeRouteEnter(to, from, next) {
            if (to.path.indexOf('/animes') != -1 && Platform.has.touch) {
                window.screen.lockOrientation('landscape');
            }

            next(function (vm) {
                get(to.path.split('/').slice(0, 3).join('/'), function (err, manga) {
                    if (err) {
                        return;
                    }
                    vm.manga = manga;
                });
            });
        },
        beforeRouteLeave(to, from, next) {
            if (from.path.indexOf('/animes') != -1 && Platform.has.touch) {
                window.screen.lockOrientation('portrait');
            }

            if (AppFullscreen.isActive()) {
                AppFullscreen.exit();
            }

            this.manga = null;
            this.loaded = false;
            next();
        },
        mounted() {
            this.$refs.img.onload = () => {
                this.loaded = true;
                this.nextLoaded = false;

                let chapter = this.$route.params.chapter;
                let page = this.$route.params.page;
                if (page == this.manga[chapter - 1].length) {
                    chapter++;

                    if (chapter > this.manga.length) {
                        return;
                    }

                    page = 1;
                } else {
                    page++;
                }

                const nextImg = new Image();
                nextImg.src = this.manga[chapter - 1][page - 1];
                nextImg.onload = () => {
                    this.nextLoaded = true;
                };
            };

            this.$refs.img.onerror = () => {
                setTimeout(() => {
                    const arr = this.manga[this.$route.params.chapter - 1];
                    arr[this.$route.params.page - 1] = arr[this.$route.params.page - 1].split('?')[0] + '?' + Date.now();
                    this.manga.splice(this.$route.params.chapter - 1, 1, arr);
                }, 1000);
            };

            if (Platform.is.desktop) {
                this.$nextTick(() => {
                    document.onkeyup = this.tap;
                });
            }
        }
    }
</script>

<style>
    img.main-image {
        max-width: 100%;
        max-height: 100%;
    }

    img.mobile-image {
        max-height: calc(100vh - 69px);
    }

    img.zoom {
        position: absolute;
        opacity: 0;
        top: 0;
        left: 0;
        border: none;
        max-width: none;
        max-height: none;
        pointer-events: none;
    }

    #anime-div, #iframe {
        position: relative;
        width: 100%;
        height: 100%;
        max-height: calc(100vh - 65px);
        max-width: calc(((100vh - 65px)/9*16));
        padding: 0;
        margin: 0 auto;
    }

    #iframe {
        position: absolute;
        top: 0;
        left: 0;
    }
</style>
