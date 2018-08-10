<template>
    <div>
        <select v-model="selectedFormat">
            <option v-for="format in formats" :value="format.id" :key="format.id">
                {{format.displayName}}
            </option>
        </select>
        <div>description:</div>
        <div v-if="selectedFormat">{{selectedFormat.description}}</div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {NormalizedFormat} from '@/types/apptypes';

export default Vue.extend({
    name: 'NewCorpus',
    props: {
        existingCorpora: Array as () => string[],
        formats: Array as () => NormalizedFormat[]
    },
    data: () => ({
        selectedFormat: null as NormalizedFormat|null,
    })

});
</script>

<style lang="scss">
</style>