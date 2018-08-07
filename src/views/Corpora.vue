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

import MessageBox from '@/components/MessageBox.vue';
import Corpus from '@/components/corpus/Corpus.vue';
import * as corporaStore from '@/store/corporastore';

export default Vue.extend({
    name: 'Corpora',
    components: {
        MessageBox,
        Corpus,
    },
    computed: {
        corpora: corporaStore.get.corpora,
        error: corporaStore.get.networkError,
        uploads: corporaStore.get.uploads
    },
    methods: {
        reload(): void {
            corporaStore.actions.load();
        }
    },
    created() {
        this.reload();
    },
});
</script>
