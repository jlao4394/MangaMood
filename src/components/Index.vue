<template>
    <q-layout v-touch-swipe.horizontal="swipeHandler">
        <div slot="header" class="toolbar">
            <ul class="breadcrumb">
                <li>
                    <router-link :to='(isAnime ? "/animes" : "/mangas")'>
                        <i>home</i>
                        <span v-if='!manga'>Manga Mood</span>
                    </router-link>
                </li>
                <li v-if='manga'>
                    <router-link :to='(isAnime ? "/animes/" : "/mangas/") + encodeURIComponent(manga)'>
                        <div :class="{'restrict-chapter': chapter && !page, 'restrict-page': page}">
                            <i>library_books</i>
                            <span>{{manga.replace('[SLASH]', '/')}}</span>
                        </div>
                    </router-link>
                </li>
                <li v-if='chapter'>
                    <router-link
                            :to='(isAnime ? "/animes/" : "/mangas/") + encodeURIComponent(manga) + "/" + (page && !isAnime ? Math.ceil(chapter/25) : encodeURIComponent(chapter))'>
                        <div :class="{'restrict-page': page}">
                            <i>book</i>
                            <span>{{!page && !isAnime ? ((chapter - 1) * 25 + 1) + ' - ' + ((chapter - 1) * 25 + 25) : chapter.replace(/(Episode|OVA|Special) /i, '')}}</span>
                        </div>
                    </router-link>
                </li>
                <li v-if='page'>
                    <a href='javascript:'>
                        <div id="pageName">
                            <i>bookmark</i>
                            <span>{{page}}</span>
                        </div>
                    </a>
                </li>

                <q-tabs v-show='!manga' class="gt-md">
                    <q-tab icon="book" route="/mangas">Manga</q-tab>
                    <q-tab icon="tv" route="/animes" replace>Anime</q-tab>
                </q-tabs>
            </ul>

            <button v-if='page && !isMobile && requestFullscreen' @click='fullscreen' type='button'
                    id='fullscreen-button'>
                <i>fullscreen</i>
            </button>
        </div>

        <div v-show='!manga' slot='header' class="toolbar primary">
            <q-search v-model.trim="search" class="primary"></q-search>
        </div>

        <q-tabs v-show='!manga' class="lt-bg" slot="navigation">
            <q-tab icon="book" route="/mangas">Manga</q-tab>
            <q-tab icon="tv" route="/animes" replace>Anime</q-tab>
        </q-tabs>

        <keep-alive>
            <router-view class="layout-view" :search='search' ref='content'></router-view>
        </keep-alive>
    </q-layout>
</template>

<script>
    import {Platform} from 'quasar';

    export default {
        data() {
            return {
                search: ''
            }
        },
        computed: {
            manga() {
                return this.$route.params.manga;
            },
            chapter() {
                return this.$route.params.chapter;
            },
            page() {
                return this.$route.params.page;
            },
            isAnime() {
                return this.$route.path.indexOf('/animes') != -1;
            },
            isMobile() {
                return Platform.has.touch;
            },
            requestFullscreen() {
                const elem = document.body;
                return elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen;
            }
        },
        methods: {
            fullscreen() {
                const elem = this.$refs.content.$el;

                if (this.requestFullscreen) {
                    this.requestFullscreen.call(elem);
                }
            },
            swipeHandler(e) {
                if (Object.keys(this.$route.params).length || e.distance.x < 50 || !this.isMobile) {
                    return;
                }

                if (this.isAnime && e.direction === 'right') {
                    this.$router.push('/mangas');
                } else if (!this.isAnime && e.direction === 'left') {
                    this.$router.push('/animes');
                }
            }
        },
        created() {
            if (Platform.has.touch) {
                window.screen.lockOrientation('portrait');
            }
        }
    }
</script>

<style>
    .q-spinner {
        margin-top: 28px;
    }

    ul.breadcrumb > li > a > div {
        max-width: calc(100vw - 110px);
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    #pageName {
        max-width: calc(100vw - 240px);
    }

    ul.breadcrumb > li > a > div.restrict-chapter {
        max-width: calc(100vw - 240px);
    }

    ul.breadcrumb > li > a > div.restrict-page {
        max-width: calc(100vw - 290px);
    }

    a, a:hover {
        color: inherit;
    }

    ul.breadcrumb li a:before {
        border-color: #049ffd;
        border-left-color: transparent;
    }

    ul.breadcrumb li a:after {
        border-left-color: #049ffd;
    }

    ul.breadcrumb li a {
        background: #049ffd;
    }

    ul.breadcrumb li:nth-child(even) a:before {
        border-color: #04b4fd;
        border-left-color: transparent;
    }

    ul.breadcrumb li:nth-child(even) a:after {
        border-left-color: #04b4fd;
    }

    ul.breadcrumb li:nth-child(even) a {
        background: #04b4fd;
    }

    #fullscreen-button > i {
        font-size: 2.1rem;
    }
</style>
