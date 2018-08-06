<template>
    <div class="corpora">
        <div v-if="!corpora && !error">
            Loading corpora...
        </div>
        <Corpus v-else-if="!error" v-for="corpus in corpora" 
            :corpus="corpus" 
            :key="corpus.id"/>

        <Error :error="error" message="Could not load corpora." :retry="reload"/>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import Error from '@/components/Error.vue';
import Corpus from '@/components/corpus/Corpus.vue';
import * as corporaStore from '@/store/corporastore';

export default Vue.extend({
    name: 'Corpora',
    components: {
        Error,
        Corpus,
    },
    computed: {
        corpora: corporaStore.get.corpora,
        error: corporaStore.get.networkError,
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
