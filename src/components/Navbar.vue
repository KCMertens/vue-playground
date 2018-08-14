<template>
    <!-- todo logo -->
    <div class="navbar">
        <ul class="navlinks">
            <li class="navlink title"><router-link to="/">{{title || 'Home'}}</router-link></li>
            <li class="navlink" v-for="(item, index) in links" :key="index">
                <a v-if="!item.local" :href="item.href" target="_blank"><span v-if="item.icon" :class="['icon', item.icon]"></span>{{item.label}}</a>
                <router-link v-else :to="item.href"><span v-if="item.icon" :class="['icon', item.icon]"></span>{{item.label}}</router-link>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import * as AppTypes from '@/types/apptypes';

export default Vue.extend({
    props: {
        links: Array as () => AppTypes.NavLink[],
        title: String as () => string|null,
    },
});
</script>

<style lang="scss">

.navbar {
    background-color: #222;
    border-bottom: 1px solid #111;
    color: #bbb;
    display: block;
    list-style: none;
    margin-bottom: 40px;
    text-align: left;


    .navlink {
        display: inline-block;

        &.title {
            a {
                color: hsl(200, 100%, 40%);
                border-color: hsl(200, 100%, 25%);
                border-left-width: 5px;
                &:hover,
                &:focus,
                &.router-link-exact-active {
                    color: hsl(200, 100%, 60%);
                    border-color: hsl(200, 100%, 45%);
                }
            }
        }
        
        a {
            border-left: 2px solid #333;
            color: inherit;
            display: inline-block;
            font-size: 1.75em;
            padding: 0.25em 0.4em;
            text-decoration: none;
        
            &:hover,
            &:focus,
            &.router-link-exact-active {
                color: #eee;
                border-color: #888;
            }
        }

    }
}
</style>
