<template>
    <div>
        <div v-if='!manga' class="text-center">
            <spinner name="dots" :size="40"></spinner>
        </div>
        <div v-else>
            <div v-if="isAnime" class="list">
                <router-link :to='encodeURIComponent(episode[0])' append v-for='episode in manga'
                             class='item item-link'>
                    <i class="item-primary">tv</i>
                    <div class="item-content">{{episode[0]}}</div>
                </router-link>
            </div>
            <div v-else class="list">
                <router-link :to='i.toString()' append v-for='i in Math.ceil(manga.length/25)' class='item item-link'
                             v-if='checkChapters(i)'>
                    <i class="item-primary">book</i>
                    <div class="item-content">Chapters {{((i - 1) * 25 + 1) + ' - ' + (i == Math.ceil(manga.length/25) ? manga.length : ((i - 1) * 25 + 25))}}</div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import {get} from '../api/index';

    export default {
        data () {
            return {
                manga: null
            }
        },
        computed: {
            isAnime() {
                return this.$route.path.indexOf('/animes') != -1;
            }
        },
        methods: {
            checkChapters(i) {
                for (let x = ((i - 1) * 25 + 1); x < ((i - 1) * 25 + 25); x++) {
                    if (this.manga[x]) {
                        return true;
                    }
                }

                return false;
            }
        },
        beforeRouteEnter(to, from, next){
            next(function (vm) {
                get(to.path, function (err, manga) {
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
