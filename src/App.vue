<template>
    <div id="app" v-if="config">
        <Navbar :links="config.navbar.links"/>
        <span>{{config.title}}</span>
        
        <div id="content">
            <router-view/>
        </div>
        <!--
        <div id="nav">
            <router-link to="/">Home</router-link> |
            <router-link to="/about">About</router-link>
        </div>
        -->
    </div>
    <div v-else-if="error">
        Oh no, some bad error happened!<br>
        {{error.title}}<br>
        {{error.message}}<br>
        code: {{error.status}}
    </div>
    <div v-else>
        Loading... (spinner here)
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Navbar from '@/components/Navbar.vue';

import {getters} from '@/store/appstore';

export default Vue.extend ({
    name: 'App',
    components: {
        Navbar,
    },
    computed: {
        config: getters.config,
        error: getters.fatalError,
    },
});
</script>


<style lang="scss">
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #222;
}
#nav {
    padding: 30px;
    a {
        font-weight: bold;
        &.router-link-exact-active {
            color: #42b983;
        }
    }
}
#content {
    margin: 50px 25px 0px;
}


</style>
