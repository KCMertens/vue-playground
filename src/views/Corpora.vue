<template>

    <div class="corpora">
        <div v-if="!corpora && !error">
            Loading corpora...
        </div>
        <div v-else-if="!error" v-for="corpus in corpora" :key="corpus.id" class="corpus">
            <a 
                :class="['fa', 'fa-search', {'disabled': !corpus.canSearch}]"
                :title="`Search the '${corpus.shortId}' corpus`"
            />
            <a 
                :class="{'disabled': !corpus.canSearch }"
                :title="`Search the '${corpus.shortId}' corpus`"
                :href="corpus.canSearch ? corpus.href : false">{{corpus.shortId}} {{corpus.statusText}}</a>
        
            <span class="size">{{corpus.sizeText}}</span>
            <span class="format">{{corpus.documentFormat}}</span>
            <span class="modified">{{corpus.timeModified}}</span>
            <button type="button" class="fa fa-cloud-upload-alt" 
                :title="`Add new data to the '${corpus.shortId}' corpus`"/>
            <button type="button" class="fa fa-user-plus"
                :title="`Share the '${corpus.shortId}' corpus with others`"/>
            <button type="button" class="fa fa-times"
                :title="`Delete the '${corpus.shortId}' corpus'`"/>
        </div>

        <Error :error="error" message="Could not load corpora."/>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {NormalizedIndex} from '@/types/apptypes';
import Error from '@/components/Error.vue';
import * as corporaStore from '@/store/corporastore';
import {formatNumber} from '@/utils/utils';

interface ExtraFields {
    href: string;
    statusText?: string;
    sizeText: string;
}

function addFields(corpus: NormalizedIndex): NormalizedIndex&ExtraFields {
    let statusText = corpus.canSearch ? '' : `(${corpus.status})`;

    if (corpus.indexProgress) {
        statusText += ` - 
            ${corpus.indexProgress.filesProcessed} files, 
            ${corpus.indexProgress.docsDone} documents, 
            and ${corpus.indexProgress.tokensProcessed} tokens indexed so far...`;
    }

    return {
        ...corpus,
        href: 'todo',
        statusText,
        sizeText: corpus.tokenCount == null ? '' : formatNumber(corpus.tokenCount),
    };
}

export default Vue.extend({
    name: 'Corpora',
    components: {
        Error,
    },
    computed: {
        corpora: () => {
            const corpora = corporaStore.get.corpora();
            return corpora ? corpora.map(addFields) : corpora;
        },
        error: corporaStore.get.networkError,
    },
    beforeCreate() {
        corporaStore.actions.load();
    },
});
</script>
