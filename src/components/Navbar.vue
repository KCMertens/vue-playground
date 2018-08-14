<template>
    <!-- todo logo -->
    <div class="navbar">
        
        <router-link to="/" class="title">{{title || 'Home'}}</router-link>

        <template class="navlink" v-for="(item, index) in dynamicLinks" >
            <a v-if="!item.local" :key="index" :href="item.href" target="_blank">
                <span v-if="item.icon" :class="['icon', item.icon]"/>{{item.label}}
            </a>
            <router-link v-else :key="index" :to="item.href">
                <span v-if="item.icon" :class="['icon', item.icon]"/>{{item.label}}
            </router-link>
        </template>

        <span class="user">
            <span class="fa fa-user"/> {{user.id || 'Guest'}}
        </span>
        
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import * as AppTypes from '@/types/apptypes';
import * as appStore from '@/store/appstore';
import * as userStore from '@/store/userstore';

export default Vue.extend({
    props: {
        // links: Array as () => AppTypes.NavLink[],
        title: String as () => string|null,
    },
    computed: {
        user: userStore.get.user,
        config: appStore.get.config,
        dynamicLinks() {
            const newLinks: AppTypes.NavLink[] = [];
            if (this.user!.loggedIn) {
                newLinks.push({
                    href: '/corpora',
                    label: 'My Corpora',
                    local: true
                });
                newLinks.push({
                    href: '/formats',
                    label: 'My Formats',
                    local: true
                });
            }
            return newLinks.concat(this.config!.navbar.links);
        }
    }
});
</script>

<style lang="scss">

$desiredheight: 40px;
@mixin size($height: 28px, $hpadding: 10px) {
    font-size: $height;
    padding: ($desiredheight - $height)/2 $hpadding;
}

.navbar {
    background-color: #222;
    border-bottom: 1px solid #111;
    color: #bbb;
    display: flex;
    margin-bottom: 40px;
    
    a {
        border-left: 2px solid #333;
        color: inherit;
        display: inline-block;
        text-decoration: none;
        @include size();

        &:hover,
        &:focus,
        &.router-link-exact-active {
            color: #eee;
            border-color: #888;
        }
        
        &.title {
            border-color: hsl(200, 100%, 25%);
            border-left-width: 5px;
            color: hsl(200, 100%, 40%);
            
            &:hover,
            &:focus,
            &.router-link-exact-active {
                border-color: hsl(200, 100%, 45%);
                color: hsl(200, 100%, 60%);
            }
        }
    }
    .user {
        @include size(14px);
    }
}
</style>
