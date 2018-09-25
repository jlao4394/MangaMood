import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

function load(component) {
    return () => System.import(`components/${component}.vue`);
}

export default new VueRouter({
    routes: [{
        path: '/', component: load('Index'), children: [
            {path: '/mangas', alias: '/animes', component: load('Mangas')},
            {path: '/mangas/:manga', alias: '/animes/:manga', component: load('Manga')},
            {path: '/mangas/:manga/:chapter', alias: '/animes/:manga/:chapter', component: load('Chapter')},
            {path: '/mangas/:manga/:chapter/:page', alias: '/animes/:manga/:chapter/:page', component: load('Page')},
            {path: '*', redirect: '/mangas'}
        ]
    }]
});
