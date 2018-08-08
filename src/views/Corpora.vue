<template>
    <div class="corpora">
        <div v-if="!corpora && !error">
            Loading corpora...
        </div>
        <Corpus v-else-if="corpora" v-for="corpus in corpora" 
            :corpus="corpus" 
            :upload-state="uploads[corpus.id]"
            :key="corpus.id"/>

        <MessageBox v-if="error"
            class="error" 
        
            title="Could not load corpora" 
            :message="error.message" 
            :retry="reload"/>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {ApiError} from '@/types/apptypes';

import MessageBox from '@/components/MessageBox.vue';
import Corpus from '@/components/corpus/Corpus.vue';
import * as corporaStore from '@/store/corporastore';

export default Vue.extend({
    name: 'Corpora',
    data: () => ({
        error: null as ApiError|null,
    }),
    components: {
        MessageBox,
        Corpus,
    },
    computed: {
        corpora: corporaStore.get.corpora,
        uploads: corporaStore.get.uploads
    },
    methods: {
        reload(): void {
            this.error = null;
            corporaStore.actions.load()
            .catch(e => this.error = e);
        }
    },
    created() {
        this.reload();
    },
});
</script>
