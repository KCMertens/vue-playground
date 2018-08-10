<template>
    <div class="corpora">
        <div v-if="!corporaInitialized && !corporaError">
            Loading corpora...
        </div>

        <Corpus v-for="(corpus, id) in corpora" 
            :corpus="corpus" 
            :key="id"/>

        <!-- format display? --> 
        <NewCorpus :formats="formatList" :existingCorpora="existingCorpora"/>

        <MessageBox v-if="corporaError"
            class="error" 
            title="Could not load corpora" 
            :message="corporaError.message" 
            :retry="reloadCorpora"/>

        <MessageBox v-if="formatError"
            class="error" 
            title="Could not load formats" 
            :message="formatError.message" 
            :retry="reloadFormats"/>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {ApiError, NormalizedFormat} from '@/types/apptypes';

import * as corporaStore from '@/store/corporastore';
import * as formatStore from '@/store/formatstore';

import MessageBox from '@/components/MessageBox.vue';
import Corpus from '@/components/corpus/Corpus.vue';
import NewCorpus from '@/components/corpus/NewCorpus.vue';

export default Vue.extend({
    name: 'Corpora',
    data: () => ({
        corporaError: null as ApiError|null,
        formatError: null as ApiError|null,

        newCorpus: null as {
            name: string,
            format: string,
        }|null,
    }),
    components: {
        MessageBox,
        Corpus,
        NewCorpus,
    },
    computed: {
        corporaInitialized: corporaStore.get.initialized,
        formatsInitialized: formatStore.get.initialized,

        corpora: corporaStore.get.corpora,
        formats: formatStore.get.formats,

        existingCorpora(): string[] { return Object.keys(this.corpora); },
        formatList(): NormalizedFormat[] { 
            return (Object.values(this.formats) as NormalizedFormat[])
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
        }
    },
    methods: {
        reloadCorpora(): void {
            this.corporaError = null;
            corporaStore.actions.load()
            .catch(e => this.corporaError = e);
        },

        reloadFormats(): void {
            this.formatError = null;
            formatStore.actions.load()
            .catch(e => this.formatError = e);
        }
    },
    watch: {
        corporaInitialized: {
            immediate: true,
            handler(newVal) {if (!newVal) { this.reloadCorpora(); }},
        },
        formatsInitialized: {
            immediate: true,
            handler(newVal) {if (!newVal) { this.reloadFormats(); }},
        }
    }
});
</script>
