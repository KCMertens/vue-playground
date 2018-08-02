<template>
    <!-- todo logo -->
    <ul class="navbar">
        <li class="navlink" v-for="(item, index) in links" :key="index">
            <a v-if="!item.local" :href="item.href" target="_blank"><span v-if="item.icon" :class="['icon', item.icon]"></span>{{item.label}}</a>
            <router-link v-else :to="item.href"><span v-if="item.icon" :class="['icon', item.icon]"></span>{{item.label}}</router-link>
        </li>
    </ul>
</template>

<script lang="ts">
import Vue from 'vue';

import * as AppTypes from '@/types/apptypes';

export default Vue.extend({
    props: {
        links: {
            type: Array as () => AppTypes.NavLink[],
        },
    },
});
</script>

<style lang="scss">
.navbar {
    background-color: #222;
    border-bottom: 1px solid #111;
    color: #bbb;
    display: block;
    font-size: 1.75em;
    list-style: none;
    text-align: left;

    .navlink {
        display: inline-block;
        
        a {
            border-left: 2px solid #333;
            color: inherit;
            display: inline-block;
            padding: 0.2em 0.4em;
            text-decoration: none;
        
            &:hover,
            &.active {
                color: #eee;
                border-color: #888;
            }
        }

    }
}
</style>
