<template>
    <div id="app">
       
        <template v-if="initialized">
            <Navbar/>
            <div id="content">
                <router-view/>
            </div>

        </template>
        <MessageBox v-else-if="error" 
            class="error"
            :title="error.title"
            :message="error.message"

            :retry="load"
        />
        <div v-else>
            Loading... (spinner here)
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Navbar from '@/components/Navbar.vue';

import * as store from '@/store';
import * as appStore from '@/store/appstore';
import * as userStore from '@/store/userstore';

import {ApiError} from '@/types/apptypes';

import MessageBox from '@/components/MessageBox.vue';

export default Vue.extend ({
    name: 'App',
    components: {
        Navbar,
        MessageBox
    },
    data: () => ({
        error: null as ApiError|null,
    }),
    computed: {
        initialized: store.get.initialized,
    },
    methods: {
        setError(e: ApiError) { this.error = e; },
        clearError() { this.error = null; },
        load() {
            this.clearError();
            store.actions.init().catch(this.setError);
        }
    },
    watch: {
        initialized: {
            immediate: true,
            handler(newValue) { if (!newValue) { this.load(); }}
        }
    }
});
</script>

<style lang="scss">
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #666;
}
#content {
    margin: 0px 25px;
}


</style>
