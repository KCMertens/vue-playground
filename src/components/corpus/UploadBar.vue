<template >
    <!-- use show so the file inputs preserve their state -->
    <div class="uploadbar" v-show="open || isUploading || isIndexing">
        <template v-show="open && canUpload"> 
            <button type="button" class="fa fa-caret-up" title="close" style="float: right" @click="close"/>
            <div style="text-align:center;">upload config panel</div>

            <file-input ref="docs"/>
            <file-input ref="meta"/>

            <button @click="upload">upload</button>
            <button @click="clearFiles">clear files</button>
            <div v-if="verificationMessage">{{verificationMessage}}</div>
        </template>

        <template v-if="isUploading && !isIndexing">
            <div style="text-align:center;">upload progress panel</div>

            <div :style="{'width': uploadProgress.progress + '%', 'background': 'hsl(225, 100%, 90%)'}" class="progress">
                Uploading... ({{uploadProgress.progress}}%)
            </div>

            <button @click="cancel" class="fa fa-times" :disabled="!isUploading || isIndexing">cancel</button>
        </template>

        <template v-if="isIndexing">
            <div style="text-align:center;">index progress panel</div>
            {{indexProgress.filesProcessed}} files, 
            {{indexProgress.docsDone}} docs and 
            {{indexProgress.tokensProcess}} tokens indexed so far...    
        </template>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import FileInput from '@/components/FileInput.vue';

import * as corporaStore from '@/store/corporastore';
import * as BLTypes from '@/types/blacklabtypes';
import * as AppTypes from '@/types/apptypes';

import * as api from '@/api';

export default Vue.extend({
    name: 'UploadBar',
    components: {
        FileInput
    },
    props: {
        open: Boolean,
        id: String,
        uploadProgress: Object as () => corporaStore.UploadState|null,
        indexProgress: Object as () => BLTypes.BLIndexProgress|null,
    },
    computed: {
        isUploading(): boolean { return !!this.uploadProgress; },
        isIndexing(): boolean { return !!this.indexProgress; },
        canUpload(): boolean { return !this.isUploading && !this.isIndexing; },
    },
    data: () => ({
        verificationMessage: null as string|null,
    }),
    methods: {
        close() { this.$emit('close'); },
        clearFiles() { (this.$refs.docs as any).clear(); (this.$refs.meta as any).clear(); },
        upload() {
            if (!this.canUpload) {
                return;
            }
            
            const docs = this.$refs.docs as any;
            const meta = this.$refs.meta as any;
            const df = docs.getFiles();
            const mf = meta.getFiles();

            if (df == null || df.length === 0) {
                this.verificationMessage = 'Please select a file.';
                return;
            }
            
            this.verificationMessage = null;
            this.$emit('start');
            corporaStore.actions.uploadDocuments({
                id: this.id, 
                docs: df, 
                meta: mf
            })
            .then(
                r => this.$emit('success', r), 
                e => this.$emit('error', e)
            )
            .finally(() => this.$emit('end'));
        },
        cancel() {
            if (!this.isUploading) {
                return;
            }
            corporaStore.actions.cancelUpload({
                id: this.id, 
                reason: 'User cancelled upload'
            });
        }
    },
});
</script>

<style lang="scss" scoped>

.uploadbar {
    outline: 1px solid skyblue;
}
.progress {
    white-space: nowrap;
}

</style>