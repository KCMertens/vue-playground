<template>
<div v-if="user">

    <h2>Create New Corpus</h2>
    <!-- TODO route back to previous view -->

    <div>
        <label for="new_corpus_name">Corpus Name</label>
        <input v-model="name" id="new_corpus_name" type="text" maxlength="80"/>
    </div>


    <div>
        <label for="new_corpus_type" title="The format of the documents that will be stored in the corpus">Document Format</label>
        <ComboBox v-model="formatId" :options="formatList.map(format => ({value: format.id, label: format.displayName}))"/>
    </div>

    <template v-if="formatId">
        <div>{{formats[formatId].description || 'No description available'}}</div>
        <a target="_blank" :href="formats[formatId].helpUrl" :disabled="!!formats[formatId].helpUrl">{{formats[formatId].helpUrl ? 'More information' : 'No help available for ' + formats[formatId].displayName}}</a>

    </template>

    <MessageBox class="error" v-if="errorMsg" :title="errorMsg.title" :message="errorMsg.message" :dismiss="clearError"/>


    <button type="button" @click="create">OK</button>
    <button type="button" @click="$router.back()">Cancel</button>

</div>
<div v-else>
    Could not load user data.
</div>
</template>

<script lang="ts">
import Vue from 'vue';

import MessageBox from '@/components/basic/MessageBox.vue';
import ComboBox from '@/components/basic/ComboBox.vue';

import {NormalizedFormat, ApiError} from '@/types/apptypes';
// import * as api from '@/api';
import * as userStore from '@/store/userstore';
import * as formatStore from '@/store/formatstore';
import * as corporaStore from '@/store/corporastore';

export default Vue.extend({
    name: 'CreateCorpus',
    components: {
        MessageBox,
        ComboBox,
    },
    props: {

    },
    computed: {
        user: userStore.get.user,
        format(): NormalizedFormat|null {
            return this.formats && this.formatId ? this.formats[this.formatId]! : null;
        },

        formats: formatStore.get.formats,
        formatList(): NormalizedFormat[] {
            return (Object.values(this.formats) as NormalizedFormat[])
             .sort((a, b) => a.displayName.localeCompare(b.displayName));
        },
        formatsInitialized: formatStore.get.initialized
    },
    data: () => ({
        formatId: null as string|null,
        name: '',

        errorMsg: null as ApiError|null,
    }),
    methods: {
        error(e: ApiError) {
            this.errorMsg = e;
        },
        clearError() {
            this.errorMsg = null;
        },

        create() {
            if (this.name.length < 3) {
                this.errorMsg = new ApiError('Cannot create new corpus', 'Please enter a longer name', '');
                return;
            } else if (this.formatId == null) {
                this.errorMsg = new ApiError('Cannot create new corpus', 'Please select a document format', '');
                return;
            }

            corporaStore.actions.createCorpus({
                id: this.user!.id + ':' + this.getShortName(this.name),
                displayName: this.name,
                formatId: this.formatId
            })
            .then(() => this.$router.replace('/corpora'), this.error);
        },

        getShortName(name: string) {
            return name.replace(/[^\w]/g, '-').replace(/^[_\d]+/, '');
        }
    },
    watch: {
        formatsInitialized: {
            immediate: true,
            handler(newVal) { if (!newVal) { formatStore.actions.load(); }},
        }
    }

});
</script>

<style lang="scss">
</style>