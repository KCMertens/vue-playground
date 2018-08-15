<template>

<div class="corpus">
    <div class="status">
        <a
            :class="['search fa fa-search', {'disabled': !canSearch}]"
            :title="`Search the '${index.shortId}' corpus`"
        />
        <a
            :class="['status', {'disabled': !canSearch }]"
            :title="`Search the '${index.shortId}' corpus`"
            :href="canSearch ? href : false">{{index.shortId}} {{statusText}}</a>

        <span class="size">{{sizeText}}</span>
        <span class="format">{{index.documentFormat}}</span>
        <span class="modified">{{index.timeModified}}</span>
        
        <template v-if="isPrivate">
            <button type="button" 
                :class="[{'active': isUploadOpen}, 'fa fa-cloud-upload-alt']" 
                :title="`Add new data to the '${index.shortId}' corpus`"
                @click="toggleUpload(undefined)"
                />
            <button type="button" 
                :class="[{'active': isShareOpen}, 'fa fa-user-plus']"
                :title="`Share the '${index.shortId}' corpus with others`"
                @click="toggleShare(undefined)"
                />
            <button type="button" 
                :class="[{'active': isDeleteOpen}, 'fa fa-times']"
                :title="`Delete the '${index.shortId}' corpus'`"
                @click="toggleDelete(undefined)"
                />
        </template>
    </div>

    <template v-if="isPrivate">
        <UploadBar 
            :open="isUploadOpen"
            :id="index.id"
            :uploadProgress="upload"
            :indexProgress="index.indexProgress"

            @close="toggleUpload(false)"

            @begin="clearStatus"
            @end="toggleUpload(true)"
            @success="success"
            @error="error"
        />
        <ShareBar
            :open="isShareOpen"
            :id="index.id"
            
            @close="toggleShare(false)"
        />
        <DeleteBar 
            :open="isDeleteOpen"
            :id="index.id"
            :display-name="index.shortId"

            @close="toggleDelete(false)"
        />
    </template>

    <MessageBox v-if="errorMsg"
        class="error"   
        :title="errorMsg.title"         
        :message="errorMsg.message"         
        :dismiss="clearError" 
    />
    <MessageBox v-if="successMsg"
        class="success" 
        :title="successMsg.status.code" 
        :message="successMsg.status.message" 
        :dismiss="clearSuccess" 
    />
</div>

</template>

<script lang="ts">
import Vue, {VueConstructor} from 'vue';

import {NormalizedIndex, ApiError} from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';
import {formatNumber} from '@/utils/utils';
import * as api from '@/api';
import * as corporaStore from '@/store/corporastore';

import MessageBox from '@/components/basic/MessageBox.vue';
import UploadBar from '@/components/corpus/UploadBar.vue';
import ShareBar from '@/components/corpus/ShareBar.vue';
import DeleteBar from '@/components/corpus/DeleteBar.vue';

export default Vue.extend({
    name: 'Corpus',
    components: {
        MessageBox,
        UploadBar,
        ShareBar,
        DeleteBar,
    },
    props: {
        corpus: Object as () => corporaStore.CorpusState,
    },
    data: () => ({
        currentPanel: null as string|null,
        /** currently displayed error */
        errorMsg: null as ApiError|null,
        /** currently displayed success */
        successMsg: null as BLTypes.BLResponse|null,
    }),
    computed: {
        // quick access
        index(): NormalizedIndex { return this.corpus.index; },
        upload(): corporaStore.UploadState|null { return this.corpus.upload; },
        
        // Rendering helpers
        isPrivate(): boolean    { return !!this.index.owner; },
        href(): string          { return 'todo'; },
        sizeText(): string      { return formatNumber(this.index.tokenCount); },
        statusText(): string    { 
            const p = this.index.indexProgress;
            
            let text = this.canSearch ? '' : `(${this.index.status})`;
            if (p) {
                    text += ` - 
                    ${p.filesProcessed} files, 
                    ${p.docsDone} documents, 
                    and ${p.tokensProcessed} tokens indexed so far...`;
            }
            return text;
        },
        isUploadOpen(): boolean { return this.currentPanel === 'upload'; },
        isDeleteOpen(): boolean { return this.currentPanel === 'delete'; },
        isShareOpen(): boolean { return this.currentPanel === 'share'; },

        // State helpers
        canSearch(): boolean { 
            return this.index.status === 'available';
        },
    },
    methods: {
        error(payload: ApiError) { this.successMsg = null; this.errorMsg = payload; },
        success(payload: BLTypes.BLResponse) { this.errorMsg = null; this.successMsg = payload; },
        clearError() { this.errorMsg = null; },
        clearSuccess() { this.successMsg = null; },
        clearStatus() { this.clearError(); this.clearSuccess(); },
      
        deleteCommit() {
            corporaStore.actions.deleteCorpus({id: this.index.id});
        },

        // ------------
        // View methods
        // ------------
        toggleUpload(state?: boolean) {
            state = state != null ? state : this.currentPanel !== 'upload';
            this.currentPanel = !state ? (this.currentPanel === 'upload' ? null : this.currentPanel) : 'upload';
        },
        toggleDelete(state?: boolean) {
            state = state != null ? state : this.currentPanel !== 'delete';
            this.currentPanel = !state ? (this.currentPanel === 'delete' ? null : this.currentPanel) : 'delete';
        },
        toggleShare(state?: boolean) {
            state = state != null ? state : this.currentPanel !== 'share';
            this.currentPanel = !state ? (this.currentPanel === 'share' ? null : this.currentPanel) : 'share';
        },
    }
});
</script>

<style lang="scss" scoped>

button.active {
    background-color: red;
}
</style>