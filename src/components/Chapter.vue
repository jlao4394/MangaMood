<template>
    <div>
        <div v-if='!manga' class="text-center">
            <spinner name="dots" :size="40"></spinner>
        </div>
        <div v-else>
            <div v-if="isAnime" class="list">
                <router-link :to='encodeURIComponent(link[0])' append class="item item-link" v-for="link in episode">
                    <i class="item-primary">tv</i>
                    <div class="item-content">
                        {{link[0]}} Source
                    </div>
                </router-link>
            </div>
            <div v-else class="list">
                <router-link v-if='manga[((chapter - 1) * 25 + n) - 1]'
                             :to='"/mangas/" + encodeURIComponent(mangaName) + "/" + ((chapter - 1) * 25 + n).toString() + "/1"'
                             class="item item-link"
                             v-for="n in 25">
                    <i class="item-primary">bookmark</i>
                    <div class="item-content">
                        Chapter {{ (chapter-1) * 25 + n }}
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import {get} from '../api/index'

    export default {
        data () {
            return {
                manga: null
            }
        },
        computed: {
            chapter() {
                if (this.$route.params.page) {
                    return;
                }

                return this.$route.params.chapter;
            },
            mangaName() {
                return this.$route.params.manga;
            },
            episode() {
                if (!this.manga || !this.chapter) {
                    return;
                }

                return this.manga.find((manga) => {
                    return manga[0] === this.chapter;
                })[1];
            },
            isAnime() {
                return this.$route.path.indexOf('/animes') != -1;
            }
        },
        beforeRouteEnter(to, from, next){
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
            this.manga = null;
            next();
        },
    }
</script>

<style>
</style>
