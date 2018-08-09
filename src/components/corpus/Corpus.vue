<template>

<div class="corpus">
    <div class="status">
        <a
            :class="['search fa fa-search', {'disabled': !canSearch}]"
            :title="`Search the '${corpus.shortId}' corpus`"
        />
        <a
            :class="['status', {'disabled': !canSearch }]"
            :title="`Search the '${corpus.shortId}' corpus`"
            :href="canSearch ? href : false">{{corpus.shortId}} {{statusText}}</a>

        <span class="size">{{sizeText}}</span>
        <span class="format">{{corpus.documentFormat}}</span>
        <span class="modified">{{corpus.timeModified}}</span>
        
        <!-- TODO disable and prevent actions while inappropriate -->
        <template v-if="isPrivate">
            <button type="button" 
                :disabled="!canUpload"
                :class="[{'active': isUploadOpen}, 'fa fa-cloud-upload-alt']" 
                :title="`Add new data to the '${corpus.shortId}' corpus`"
                @click="toggleUpload(undefined)"
                />
            <button type="button" 
                :disabled="!canShare"
                :class="[{'active': isShareOpen}, 'fa fa-user-plus']"
                :title="`Share the '${corpus.shortId}' corpus with others`"
                @click="toggleShare(undefined)"
                />
            <button type="button" 
                :disabled="!canDelete"
                :class="[{'active': isDeleteOpen}, 'fa fa-times']"
                :title="`Delete the '${corpus.shortId}' corpus'`"
                @click="toggleDelete(undefined)"
                />
        </template>
    </div>

    <div class="upload-config" v-show="isUploadOpen">
        <button type="button" class="fa fa-times" title="close" style="float: right" @click="toggleUpload(false)"></button>   
        <div style="text-align:center;">upload config panel</div>

        <file-input ref="docs"/>
        <file-input ref="meta"/>
        <button @click="uploadCommit">upload</button>

        <button @click="$refs.docs.clear(), $refs.meta.clear()">clear files</button>
    </div>

    <!-- TODO isUploading isIndexing -->
    <div class="upload-progress" v-if="uploadState.progress != null && (uploadState.progress !== 100 || corpus.indexProgress == null)">
        <div style="text-align:center;">upload progress panel</div>
        <div :style="{'width': uploadState.progress + '%', 'background': 'hsl(225, 100%, 90%)'}" class="progress">
            Uploading... ({{uploadState.progress}}%)
        </div>

        <button @click="uploadCancel" class="fa fa-times" :disabled="!uploadState.cancel"> cancel</button>
    </div>
    <div class="index-progress" v-if="corpus.indexProgress != null">
        <div style="text-align:center;">index progress panel</div>
        
        Indexing...<br/>
        {{`${corpus.indexProgress.filesProcessed} files, ${corpus.indexProgress.docsDone} docs, ${corpus.indexProgress.tokensProcessed} tokens processed.`}}
    </div>

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

        Are you sure you want to delete the '{{corpus.shortId}}' corpus?<br>
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

import FileInput from '@/components/FileInput.vue';
import MessageBox from '@/components/MessageBox.vue';

export default Vue.extend({
    name: 'Corpus',
    components: {
        MessageBox,
        FileInput,
    },
    props: {
        corpus: Object as () => NormalizedIndex,
        uploadState: Object as () => corporaStore.CorporaState['uploads'][string],
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
        // Rendering helpers
        isPrivate(): boolean    { return this.corpus.shortId !== this.corpus.id; },
        href(): string          { return 'todo'; },
        sizeText(): string      { return formatNumber(this.corpus.tokenCount); },
        statusText(): string    { 
            const {indexProgress: p} = this.corpus;
            
            let text = this.canSearch ? '' : `(${this.corpus.status})`;
            if (p) {
                    text += ` - 
                    ${p.filesProcessed} files, 
                    ${p.docsDone} documents, 
                    and ${p.tokensProcessed} tokens indexed so far...`;
            }
            return text;
        },
        isUploadOpen(): boolean { return this.currentPanel === 'upload' && this.canUpload; },
        isDeleteOpen(): boolean { return this.currentPanel === 'delete' && this.canDelete; },
        isShareOpen(): boolean { return this.currentPanel === 'share' && this.canShare; },

        // State helpers
        canSearch(): boolean { 
            return this.corpus.status === 'available';
        },
        canUpload(): boolean {
            return this.isPrivate 
                && this.uploadState.progress == null 
                && this.corpus.indexProgress == null;
        },
        canDelete(): boolean {
            return this.isPrivate 
                && this.uploadState.progress == null 
                && this.corpus.indexProgress == null;
            // && !isDeleting
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
        
        uploadCommit(): void {
            if (this.uploadState.progress != null || this.corpus.indexProgress != null) {
                return;
            }
            
            const docs = this.$refs.docs as any;
            const meta = this.$refs.meta as any;
            const df = docs.getFiles();
            const mf = meta.getFiles();

            if (df == null || df.length === 0) {
                this.error(new ApiError(
                    'Cannot upload', 
                    'You need to select some documents first.', 
                    ''
                ));
                return;
            }
            
            this.clearStatus();
            corporaStore.actions.uploadDocuments({
                id: this.corpus.id, 
                docs: df, 
                meta: mf
            })
            .then(this.success, this.error)
            .finally(() => this.toggleUpload(true));
        },
        uploadCancel() {
            if (this.uploadState.cancel) {
                corporaStore.actions.cancelUpload({
                    id: this.corpus.id,
                    reason: 'Upload cancelled'
                }).then((ret) => {
                    console.log('after cancellation processed, got return value', ret);
                    
                    console.log('context: ', this.uploadState.progress);
                });

            }
        },

        shareCommit() {
            if (this.shareInfoLoading) {
                return;
            }

            this.shareInfoLoading = true;
            api.blacklab
            .postShares(this.corpus.id, this.shareInfo!.map(i => i.value))
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
            .getShares(this.corpus.id)
            .then(shares => {
                this.shareInfo = shares.map(s => ({ value: s }));
                this.shareInfoEdited = false;
            })
            .catch(this.error)
            .finally(() => this.shareInfoLoading = false);
        },

        deleteCommit() {
            corporaStore.actions.deleteCorpus({id: this.corpus.id});
        },

        // ------------
        // View methods
        // ------------
        toggleUpload(state?: boolean) {
            if (state == null) {
                state = this.currentPanel !== 'upload';
            }
            if (state && this.canUpload) {
                this.currentPanel = 'upload';
            } else if (!state && this.currentPanel === 'upload') {
                this.currentPanel = null;
            }
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

.progress {
    white-space: nowrap;
}

// @mixin color($base) {
//     background: $base;
//     border-color: change-color($base, $lightness: 0.5*lightness($base));
//     background: linear-gradient(
//         to bottom, 
//         change-color($base, $lightness: 1.25*lightness($base))  0%, 
//         $base                                   45%, 
//         change-color($base, $lightness: 0.85*lightness($base))  100%
//     );
//     color: scale-color($base, $lightness: 95%);
// }

// .corpus {
//     & >>> .error, 
//     & >>> .success {
//         border-width: 1px;
//         border-style: solid;
//         // TODO mixin inset box-shadow strong
//         box-shadow: inset 0px 3px 6px 0px rgba(0,0,0,0.4);
//         color: #e8e8e8;
//         text-shadow: 1px 1px 3px black;

//         /deep/ .title {
//             padding: 8px 12px 4px;
//             border-bottom: 1px solid;
//             border-color: inherit;
//             background-color: rgba(0,0,0,0.25);
//             // TODO mixin outset box-shadow subtle
//             box-shadow: 0px 1px 3px -1px rgba(0,0,0,0.2);
//             display: flex;
//             justify-content: space-between;
//             align-items: center;
//         }
//         /deep/ .message {
//             padding: 12px 12px 15px;
//         }

//         /deep/ .dismiss {
//             background: none;
//             border: 1px solid;
//             border-radius: 100px;
//             box-sizing: content-box;
//             color: inherit;
//             cursor: pointer;
//             font-size: 100%;
//             height: 1em;
//             padding: 0;
//             width: 1em;
//         }
//     }
//     .error { @include color(hsl(355, 90%, 26%)); }
//     .success { @include color(hsl(115, 90%, 26%)); }
// }

</style>