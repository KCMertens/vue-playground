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
        
        <!-- TODO disable and prevent actions while inappropriate -->
        <template v-if="isPrivate">
            <button type="button" 
                :class="[{'active': isUploadOpen}, 'fa fa-cloud-upload-alt']" 
                :title="`Add new data to the '${index.shortId}' corpus`"
                @click="toggleUpload(undefined)"
                />
            <button type="button" 
                :disabled="!canShare"
                :class="[{'active': isShareOpen}, 'fa fa-user-plus']"
                :title="`Share the '${index.shortId}' corpus with others`"
                @click="toggleShare(undefined)"
                />
            <button type="button" 
                :disabled="!canDelete"
                :class="[{'active': isDeleteOpen}, 'fa fa-times']"
                :title="`Delete the '${index.shortId}' corpus'`"
                @click="toggleDelete(undefined)"
                />
        </template>
    </div>

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

    <div class="share-config" v-if="isShareOpen">
        <button type="button" class="fa fa-times" title="close" style="float: right" @click="toggleShare(false)"></button>   
        <div style="text-align:center;">share config panel</div>


        <div v-if="!shareInfo && this.shareInfoLoading">Loading...</div>
        <div v-else-if="shareInfo">
            <div v-for="(share, index) in shareInfo" :key="index">
                <input type="text" :disabled="shareInfoLoading" v-model="share.value" @change="shareInfoEdited = true"/>
                <button class="fa fa-times" type="button" :disabled="shareInfoLoading" @click="shareInfo.splice(index, 1)"></button>
            </div>

            <div class="sharecontrols">
                <button type="button" :disabled="shareInfoLoading" @click="shareInfo.push({value: ''})" class="fa fa-plus"/>
                <button type="button" :disabled="shareInfoLoading || !shareInfo.length" @click="shareInfo.splice(0)">remove all</button>
                <button type="button" :disabled="shareInfoLoading" @click="shareReload">undo unsaved changes</button>

                <button type="button" :disabled="shareInfoLoading || !shareInfoEdited" @click="shareCommit">save changes</button>
            </div>
        </div>
    </div>

    <div class="delete-config" v-if="isDeleteOpen">
        <button type="button" class="fa fa-times" title="close" style="float: right" @click="toggleDelete(false)"></button>   
        <div style="text-align:center;">delete config panel</div>

        Are you sure you want to delete the '{{index.shortId}}' corpus?<br>
        <button @click="deleteCommit">OK</button>
        <button @click="toggleDelete(false)">Cancel</button>
    
    </div>

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

import MessageBox from '@/components/MessageBox.vue';
import UploadBar from '@/components/corpus/UploadBar.vue';

export default Vue.extend({
    name: 'Corpus',
    components: {
        MessageBox,
        UploadBar,
    },
    props: {
        corpus: Object as () => corporaStore.CorpusState,
    },
    data: () => ({
        /** Editable instance of user shares */
        shareInfo: null as Array<{value: string}>|null,
        /** Are shares currently loading or saving */
        shareInfoLoading: false,
        /** Has the user edited the shares (e.g. enable the reload/save buttons) */
        shareInfoEdited: false,

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
        isDeleteOpen(): boolean { return this.currentPanel === 'delete' && this.canDelete; },
        isShareOpen(): boolean { return this.currentPanel === 'share' && this.canShare; },

        // State helpers
        canSearch(): boolean { 
            return this.index.status === 'available';
        },
        canDelete(): boolean {
            return this.isPrivate 
                && this.upload == null
                && this.index.indexProgress == null;
        },
        canShare(): boolean {
            return true;
        },
    },
    methods: {
        error(payload: ApiError) { this.successMsg = null; this.errorMsg = payload; },
        success(payload: BLTypes.BLResponse) { this.errorMsg = null; this.successMsg = payload; },
        clearError() { this.errorMsg = null; },
        clearSuccess() { this.successMsg = null; },
        clearStatus() { this.clearError(); this.clearSuccess(); },
      
        shareCommit() {
            if (this.shareInfoLoading) {
                return;
            }

            this.shareInfoLoading = true;
            api.blacklab
            .postShares(this.index.id, this.shareInfo!.map(i => i.value))
            .then(response => {
                this.success(response);
                this.shareInfoEdited = false;
            })
            .catch(this.error)
            .finally(() => this.shareInfoLoading = false);
        },
        shareReload() {
            if (this.shareInfoLoading) {
                return;
            }

            this.shareInfoLoading = true;
            api.blacklab
            .getShares(this.index.id)
            .then(shares => {
                this.shareInfo = shares.map(s => ({ value: s }));
                this.shareInfoEdited = false;
            })
            .catch(this.error)
            .finally(() => this.shareInfoLoading = false);
        },

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
            if (state == null) {
                state = this.currentPanel !== 'delete';
            }
            if (state && this.canDelete) {
                this.currentPanel = 'delete';
            } else if (!state && this.currentPanel === 'delete') {
                this.currentPanel = null;
            }
        },
        toggleShare(state?: boolean) {
            // Load shares from store if not done
            // If not present, get from api, then load here
            if (state == null) {
                state = this.currentPanel !== 'share';
            }
            
            if (state && this.canShare) {
                this.currentPanel = 'share';
                if (!this.shareInfo) {
                   this.shareReload();
                }
            } else if (!state && this.currentPanel === 'share') {
                this.currentPanel = null;
            }
        },
    }
});






</script>

<style lang="scss" scoped>
button.active {
    background-color: red;
}

.upload-config,
.upload-progress,
.index-progress {
    outline: 1px solid skyblue;
}

.delete-config {
    outline: 1px solid orange;
}

.share-config {
    outline: 1px solid lightgreen;
}
</style>