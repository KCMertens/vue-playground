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
        <div style="text-align:center;">share config panel</div>
    </div>

    <div class="delete-config" v-if="isDeleteOpen">
        <div style="text-align:center;">delete config panel</div>
        <button class="fa fa-times"></button>
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
import {blacklab as BLApi} from '@/api';
import * as corporaStore from '@/store/corporastore';

// import Error from '@/components/Error.vue';
// import Success from '@/components/Success.vue';
import FileInput from '@/components/FileInput.vue';
import MessageBox from '@/components/MessageBox.vue';

type test = typeof FileInput;

export default Vue.extend({
    name: 'Corpus',
    components: {
        MessageBox,
        // Success,
        FileInput,
    },
    props: {
        corpus: Object as () => NormalizedIndex,
        uploadState: Object as () => corporaStore.CorporaState['uploads'][string]
    },
    data: () => ({
        currentPanel: null as string|null,

        /** currently displayed error */
        errorMsg: null as ApiError|null,
        /** currently displayed success */
        successMsg: null as BLTypes.BLResponse|null,
    }),
    computed: {
        isPrivate(): boolean    { 
            return this.corpus.shortId !== this.corpus.id; 
        },
        
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

        canSearch(): boolean { 
            return this.corpus.status === 'available'; 
        },
        isUploadOpen(): boolean { return this.currentPanel === 'upload' && this.canUpload; },
        canUpload(): boolean {
            return this.isPrivate 
                && this.uploadState.progress == null 
                && this.corpus.indexProgress == null;
        },
        isDeleteOpen(): boolean { return this.currentPanel === 'delete' && this.canDelete; },
        canDelete(): boolean {
            return this.isPrivate 
                && this.uploadState.progress == null 
                && this.corpus.indexProgress == null;
            // && !isDeleting
        },
        isShareOpen(): boolean { return this.currentPanel === 'share' && this.canShare; },
        canShare(): boolean {
            return true;
        }
    },
    methods: {
        error(payload: ApiError) {
            this.successMsg = null;
            this.errorMsg = payload;
        },
        success(payload: BLTypes.BLResponse) {
            this.errorMsg = null;
            this.successMsg = payload;
        },
        clearError() {
            this.errorMsg = null;
        },
        clearSuccess() {
            this.successMsg = null;
        },
        clearStatus() {
            this.clearError();
            this.clearSuccess();
        },
        
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

                // console.log('immediately after cancel: ', this.uploadState, this.corpus);
            }
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
            if (state == null) {
                state = this.currentPanel !== 'share';
            }
            if (state && this.canShare) {
                this.currentPanel = 'share';
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