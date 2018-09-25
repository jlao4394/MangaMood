<template>
    <div>
        <div v-if='!mangas' class="text-center">
            <spinner name="dots" :size="40"></spinner>
        </div>
        <q-infinite-scroll v-else :handler="loadMore" ref='scroll'>
            <div v-for="manga in showing" class='manga-card' :key="manga[0]">
                <router-link :to='encodeURIComponent(manga[0])' append class="card">
                    <img v-scroll-fire="showImage(manga[1])">
                    <div class="card-content text-center">
                        {{manga[0].replace('[SLASH]', '/')}}
                    </div>
                </router-link>
            </div>

            <div slot="message" class="text-center">
                <spinner name="dots" :size="40"></spinner>
            </div>
        </q-infinite-scroll>
    </div>
</template>

<script>
    import {get} from '../api/index';

    export default {
        props: ['search'],
        data () {
            return {
                mangas: null,
                index: 1
            }
        },
        computed: {
            showing() {
                if (this.search.length) {
                    this.$el.scrollTop = 1; //Fire scrollfire on cached v-for items
                    this.$el.scrollTop = 0;
                    const search = this.search.replace('/', '[SLASH]').toLowerCase();
                    return this.mangas.filter((manga) => {
                        return manga[0].toLowerCase().indexOf(search) != -1;
                    }).slice(0, this.itemsToShow);
                }

                if (this.$refs.scroll) {
                    this.$refs.scroll.resume();
                }

                return this.mangas.slice(0, this.itemsToShow * this.index);
            },
            isAnime() {
                return this.$route.path.indexOf('/animes') != -1;
            },
            itemsToShow() {
                const el = this.$el;
                const w = el.clientWidth;
                const h = el.clientHeight;
                let cardsPerRow;

                if (w < 550) {
                    cardsPerRow = 3;
                } else if (w < 700) {
                    cardsPerRow = 4;
                } else if (w < 850) {
                    cardsPerRow = 5;
                } else if (w < 1024) {
                    cardsPerRow = 6;
                } else if (w < 1200) {
                    cardsPerRow = 7;
                } else if (w < 1366) {
                    cardsPerRow = 8;
                } else if (w < 1600) {
                    cardsPerRow = 9;
                } else if (w < 1800) {
                    cardsPerRow = 10;
                } else if (w < 1920) {
                    cardsPerRow = 11;
                } else {
                    cardsPerRow = 12;
                }

                return Math.ceil((h / 210) + 1) * cardsPerRow;
            }
        },
        watch: {
            isAnime() {
                this.mangas = null;
                this.index = 1;
                this.$el.scrollTop = 0;
                get(this.$route.path, (err, mangas) => {
                    if (err) {
                        return;
                    }
                    this.mangas = mangas;
                });
            }
        },
        methods: {
            loadMore: function (index, done) {
                if (!this.search.length) {
                    this.index++;
                } else {
                    this.$refs.scroll.stop();
                }

                done();
            },
            showImage(src) {
                return function (element) {
                    element.src = src;
                };
            }
        },
        beforeRouteEnter(to, from, next){
            next(function (vm) {
                get(to.path, function (err, mangas) {
                    if (err) {
                        return;
                    }
                    vm.mangas = mangas;
                });
            });
        }
    }
</script>

<style>
    .manga-card {
        display: inline-block;
        width: 33%;
        padding: 5px;
    }

    .manga-card > .card {
        margin-bottom: 0;
        height: 210px;
    }

    .manga-card > .card > img {
        height: 157px;
    }

    .manga-card > .card > .card-content {
        padding: 5px;
    }

    @media (min-width: 550px) {
        .manga-card {
            width: 25%;
        }
    }

    @media (min-width: 700px) {
        .manga-card {
            width: 20%;
        }
    }

    @media (min-width: 850px) {
        .manga-card {
            width: 16.66%;
        }
    }

    @media (min-width: 1024px) {
        .manga-card {
            width: 14.28%;
        }
    }

    @media (min-width: 1200px) {
        .manga-card {
            width: 12.5%;
        }
    }

    @media (min-width: 1366px) {
        .manga-card {
            width: 11.11%;
        }
    }

    @media (min-width: 1600px) {
        .manga-card {
            width: 10%;
        }
    }

    @media (min-width: 1800px) {
        .manga-card {
            width: 9.09%;
        }
    }

    @media (min-width: 1920px) {
        .manga-card {
            width: 8.33%;
        }
    }
</style>
