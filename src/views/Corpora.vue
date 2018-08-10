<template>
    <div class="corpora">
        <div v-if="!initialized && !error">
            Loading corpora...
        </div>

        <Corpus v-else-if="initialized" v-for="(corpus, id) in corpora" 
            :corpus="corpus" 
            :key="id"/>

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
        initialized: corporaStore.get.initialized,
        corpora: corporaStore.get.corpora,
    },
    methods: {
        reload(): void {
            this.error = null;
            corporaStore.actions.load()
            .catch(e => this.error = e);
        }
    },
    watch: {
        initialized: {
            immediate: true,
            handler(newVal, oldVal) {
                if (!newVal) {
                    this.reload();
                }
            }
        }
    }
});
</script>
