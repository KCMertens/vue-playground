<template>
    <div class="formats">
         
        <MessageBox v-if="errorMsg"
            class="error" 
            title="Could not load formats" 
            :message="errorMsg.message" 
            :retry="reload"/>

        <div class="public">
            <h2>Public formats</h2>
            <Format v-for="format in publicFormats" v-if="format.isVisible" 
                :id="format.id"
                :key="format.id"/>
        </div>

        <div v-if="user.loggedIn" class="private">
            <h2>Your formats</h2>
            <Format v-for="format in privateFormats"
                :id="format.id"
                :key="format.id"/>

            <button v-if="user && user.loggedIn" type="button" @click="$router.push('/create-format')">Create new format</button>
        </div>

        
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {ApiError, NormalizedFormat} from '@/types/apptypes';

import * as userStore from '@/store/userstore';
import * as formatStore from '@/store/formatstore';

import RouterLink from 'vue-router';
import MessageBox from '@/components/MessageBox.vue';
import Format from '@/components/format/Format.vue';

export default Vue.extend({
    name: 'Formats',
    data: () => ({
        errorMsg: null as ApiError|null,
    }),
    components: {
        MessageBox,
        Format,
    },
    computed: {
        user: userStore.get.user,

        formats: formatStore.get.formats,
        publicFormats() { 
            return (Object.values(this.formats) as NormalizedFormat[])
            .filter(f => f.owner == null)
            .sort((a, b) => a.displayName.localeCompare(b.displayName)); 
        },
        privateFormats() { 
            return (Object.values(this.formats) as NormalizedFormat[])
            .filter(f => f.owner != null)
            .sort((a, b) => a.displayName.localeCompare(b.displayName)); 
        },
    },
    methods: {
        setError(e: ApiError) { this.errorMsg = e; },
        clearError() { this.errorMsg = null; },
        reloadFormats(): void {
            this.errorMsg = null;
            formatStore.actions.load().catch(this.setError);
        },
    },
    watch: {
        corporaInitialized: {
            immediate: true,
            handler(newVal) {if (!newVal) { this.reloadFormats(); }},
        },
    },
});
</script>

<style>

h2 {
    font-size: 28px;
    display:block;
    font-weight: bold;
    color: #333;
    margin: 10px 0px;
}
</style>