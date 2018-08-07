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
                @click="toggleUpload"
                />
            <button type="button" 
                :disabled="!canShare"
                :class="[{'active': isShareOpen}, 'fa fa-user-plus']"
                :title="`Share the '${corpus.shortId}' corpus with others`"
                @click="toggleShare"
                />
            <button type="button" 
                :disabled="!canDelete"
                :class="[{'active': isDeleteOpen}, 'fa fa-times']"
                :title="`Delete the '${corpus.shortId}' corpus'`"
                @click="toggleDelete"
                />
        </template>
    </div>

    <div class="upload-config" v-show="isUploadOpen">
        <div style="text-align:center;">upload config panel</div>
       
        <file-input ref="docs"/>
        <file-input ref="meta"/>
        <button @click="uploadCommit">upload</button>

        <Error :error="uploadState.error"/>
        <!-- <button>clear (TODO)</button> -->
    </div>

    <!-- TODO isUploading isIndexing -->
    <div class="upload-progress" v-if="uploadState.progress != null">
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
    </div>
</div>

</template>

<script lang="ts">
import Vue, {VueConstructor} from 'vue';

import {NormalizedIndex, ApiError} from '@/types/apptypes';
import * as BLTypes from '@/types/blacklabtypes';
import {formatNumber} from '@/utils/utils';
import {blacklab as BLApi} from '@/api';
import * as corporaStore from '@/store/corporastore';

import Upload from '@/components/corpus/Upload.vue';
import Error from '@/components/Error.vue';
import FileInput from '@/components/FileInput.vue';

type test = typeof FileInput;

export default Vue.extend({
    name: 'Corpus',
    components: {
        Upload,
        Error,
        FileInput,
    },
    props: {
        corpus: Object as () => NormalizedIndex,
        uploadState: Object as () => corporaStore.CorporaState['uploads'][string]
    },
    data: () => ({
        currentState: null as string|null,

        /** currently displayed error */
        error: null as ApiError|null,
        /** currently displayed success */
        success: null as BLTypes.BLResponse|null,
    }),
    computed: {
        isPrivate(): boolean    { 
            return this.corpus.shortId !== this.corpus.id; 
        },
        
        
        href(): string          { return 'todo'; },
        sizeText(): string      { return formatNumber(this.corpus.tokenCount); },
        
        // isBusy(): boolean       { return this.corpus.status !== 'available' && this.corpus.status !== 'empty'; },
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
        isUploadOpen(): boolean { return this.currentState === 'upload' && this.canUpload; },
        canUpload(): boolean {
            return this.isPrivate 
                && this.uploadState.progress == null 
                && this.corpus.indexProgress == null;
        },
        isDeleteOpen(): boolean { return this.currentState === 'delete' && this.canDelete; },
        canDelete(): boolean {
            return this.isPrivate 
                && this.uploadState.progress == null 
                && this.corpus.indexProgress == null;
            // && !isDeleting
        },
        isShareOpen(): boolean { return this.currentState === 'share' && this.canShare; },
        canShare(): boolean {
            return true;
        }
    },
    methods: {
        uploadCommit(): void {
            if (this.uploadState.progress != null || this.corpus.indexProgress != null) {
                return;
            }
            
            const docs = this.$refs.docs as any;
            const meta = this.$refs.meta as any;
            const df = docs.getFiles();
            const mf = meta.getFiles();

            if (df == null || df.length === 0) {
                this.error = new ApiError('Cannot upload', 'You need to select some documents first.', '');
                return;
            }
            
            corporaStore.actions.uploadDocuments({
                id: this.corpus.id, 
                docs: df, 
                meta: mf
            });
            // keep panel state so we can choose to restore it after we're done uploading 
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
        toggleUpload() {
            if (this.currentState === 'upload') {
                this.currentState = null;
            } else if (this.canUpload) {
                this.currentState = 'upload';
            }
        },
        toggleDelete() {
            if (this.currentState === 'delete') {
                this.currentState = null;
            } else if (this.canDelete) {
                this.currentState = 'delete';
            }
        },
        toggleShare() {
            if (this.currentState === 'share') {
                this.currentState = null;
            } else if (this.canShare) {
                this.currentState = 'share';
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
</style>