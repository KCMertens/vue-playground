<template>
    <div class="corpora">
        <div v-if="!corporaInitialized && !corporaError">
            Loading corpora...
        </div>
         
        <MessageBox v-if="corporaError"
            class="error" 
            title="Could not load corpora" 
            :message="corporaError.message" 
            :retry="reloadCorpora"/>

        <Corpus v-for="(corpus, id) in corpora" 
            :corpus="corpus" 
            :key="id"/>

        <template v-if="user && user.loggedIn">
            <div v-if="!user.canCreateIndex">You cannot create any more corpora</div>
            <button v-else type="button"  @click="$router.push('/create-corpus')">Create new corpus</button>
        </template>
       
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {ApiError, NormalizedFormat} from '@/types/apptypes';

import * as userStore from '@/store/userstore';
import * as corporaStore from '@/store/corporastore';

import RouterLink from 'vue-router';
import MessageBox from '@/components/MessageBox.vue';
import Corpus from '@/components/corpus/Corpus.vue';

export default Vue.extend({
    name: 'Corpora',
    data: () => ({
        corporaError: null as ApiError|null,
    }),
    components: {
        MessageBox,
        Corpus,
    },
    computed: {
        corporaInitialized: corporaStore.get.initialized,

        corpora: corporaStore.get.corpora,
        user: userStore.get.user,
    },
    methods: {
        reloadCorpora(): void {
            corporaStore.actions.load();
        },
    },
    watch: {
        corporaInitialized: {
            immediate: true,
            handler(newVal) {if (!newVal) { this.reloadCorpora(); }},
        },
    },
});
</script>
