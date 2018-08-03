<template>

<div class="corpus">
    <div class="status">
        <a
            :class="['search', 'fa', 'fa-search', {'disabled': !canSearch}]"
            :title="`Search the '${corpus.shortId}' corpus`"
        />
        <a
            :class="['status', {'disabled': !canSearch }]"
            :title="`Search the '${corpus.shortId}' corpus`"
            :href="canSearch ? href : false">{{corpus.shortId}} {{statusText}}</a>

        <span class="size">{{sizeText}}</span>
        <span class="format">{{corpus.documentFormat}}</span>
        <span class="modified">{{corpus.timeModified}}</span>
        
        <button type="button" 
            v-if="isPrivate" 
            @click="toggleMode('upload')"
            :class="['fa fa-cloud-upload-alt', {'active': isMode('upload')}]" 
            :title="`Add new data to the '${corpus.shortId}' corpus`"
            />
        <button v-if="isPrivate" type="button" class="fa fa-user-plus"
            :title="`Share the '${corpus.shortId}' corpus with others`"/>
        <button v-if="isPrivate" type="button" class="fa fa-times"
            :title="`Delete the '${corpus.shortId}' corpus'`"/>
    </div>

    <div v-if="isMode('upload')" class="upload">
        <div>
            <input type="file" name="documents" multiple :id="`${corpus.id}-upload-documents`"
                @change="uploadChange"
                ref="uploadDocuments"
                />
            <label :for="`${corpus.id}-upload-documents`">documents {{ upload.documentCount && `(${upload.documentCount})` }}</label>
        </div>
        <div>
            <input type="file" name="metadata" multiple :id="`${corpus.id}-upload-metadata`"
                @change="uploadChange"
                ref="uploadMetadata"
                />
            <label :for="`${corpus.id}-upload-metadata`">metadata {{ upload.metadataCount && `(${upload.metadataCount})` }}</label>
        </div>
        
        <button @click="uploadSave">save</button>
        <button @click="uploadCancel" class="fa fa-times"> cancel</button>

        <Error unstyled :error="uploadError"/>
    </div>
</div>

</template>

<script lang="ts">
import Vue from 'vue';

import {NormalizedIndex, ApiError} from '@/types/apptypes';
import {formatNumber} from '@/utils/utils';

import Upload from '@/components/corpus/Upload.vue';
import Error from '@/components/Error.vue';

export default Vue.extend({
    name: 'Corpus',
    components: {
        Upload,
        Error,
    },
    props: {
        corpus: Object as () => NormalizedIndex,
    },
    data: () => ({
        mode: null as string|null,
        uploadError: null as ApiError|null,

        upload: {
            documentCount: null as number|null,
            metadataCount: null as number|null,
        },
    }),
    computed: {
        href(): string          { return 'todo'; },
        sizeText(): string      { return formatNumber(this.corpus.tokenCount); },
        canSearch(): boolean    { return this.corpus.status === 'available'; },
        isBusy(): boolean       { return this.corpus.status !== 'available' && this.corpus.status !== 'empty'; },
        isPrivate(): boolean    { return this.corpus.shortId !== this.corpus.id; },
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
    },
    methods: {
        toggleMode(mode: string|null): void { this.mode = (this.mode === mode) ? null : mode; },
        isMode(mode: string): boolean { return this.mode === mode; },

        uploadSave(): void { this.toggleMode(null); },
        uploadCancel(): void { this.toggleMode(null); },
        uploadChange(): void {
            const docs = this.$refs.uploadDocuments as HTMLInputElement;
            const meta = this.$refs.uploadMetadata as HTMLInputElement;
            
            this.upload.documentCount = docs.files && docs.files.length || null;
            this.upload.metadataCount = meta.files && meta.files.length || null;
        },
    },
});

</script>

<style lang="scss" scoped>
button.active {
    background-color: red;
}
</style>