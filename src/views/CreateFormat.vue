<template>

    <div>
        <h2>New document format</h2>
        <div>
            <label for="open_format_file">Open a file from your computer</label>
            <FileInput :disabled="readingFile" type="text" label="Open a file from your computer" @change="onFileChanged" ref="file"/>
        </div>

        <div>
            <label for="format_select">Open an existing format</label>

            <form @submit.prevent="downloadFormat">
                <combo-box filter v-model="formatToDownload"
                    :options="formatList.filter(f => f.configurationBased).map(f => ({label: f.displayName, value: f.id}))"
                    placeholder="Choose a format"
                />
                <button type="submit" :disabled="!formatToDownload && !downloadingFormat">download</button>
            </form>
        </div>

        <div>
            <h3>Edit area</h3>
                <!-- name, type -->
            <label for="format_name">Format name</label><input type="text" id="format_name"/>
            <select id="format_type" class="selectpicker" data-width="auto" data-style="btn-primary">
                <option label="YAML" value="yaml" selected>YAML</option>
                <option label="JSON" value="json">JSON</option>
            </select>
            <textarea id="format_editor" style="width:100%;" v-model="formatContent"/>
        </div>


        <div>
            <button type="button">OK</button>
            <button type="button" >Cancel</button>
        </div>
        <h5 class="pull-left"><span class="fa fa-question-circle text-muted"></span> <a href="http://inl.github.io/BlackLab/how-to-configure-indexing.html" target="_blank" style="font-weight: bold">How to write your own format</a></h5>

        <MessageBox class="success" v-if="successMsg"
            :title="successMsg.title"
            :message="successMsg.message"
            :dismiss="clearStatus"
        />

        <MessageBox class="error" v-if="errorMsg"
            :title="errorMsg.title"
            :message="errorMsg.message"
            :dismiss="clearStatus"
        />

    </div>


</template>

<script lang="ts">
import Vue from 'vue';

import * as formatStore from '@/store/formatstore';
import * as api from '@/api';

import ComboBox from '@/components/basic/ComboBox.vue';
import MessageBox from '@/components/basic/MessageBox.vue';
import FileInput from '@/components/basic/FileInput.vue';

import {NormalizedFormat, ApiError} from '@/types/apptypes';
import {BLResponse} from '@/types/blacklabtypes';

export default Vue.extend({
    name: 'CreateFormat',
    components: {
        ComboBox,
        MessageBox,
        FileInput
    },
    data: () => ({
        errorMsg: null as ApiError|null,
        successMsg: null as BLResponse|null,
        formatToDownload: '',
        formatContent: '',
        downloadingFormat: false,
        readingFile: false,
    }),
    computed: {
        formats: formatStore.get.formats,
        formatList(): NormalizedFormat[] {
            return (Object.values(this.formats) as NormalizedFormat[])
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
        }
    },
    methods: {
        setError(e: ApiError) { this.errorMsg = e; this.successMsg = null; },
        setSuccess(s: BLResponse) { this.successMsg = s; this.errorMsg = null; },
        clearStatus() { this.errorMsg = this.successMsg = null; },

        downloadFormat() {
            if (!this.formatToDownload) {
                return;
            }

            this.downloadingFormat = true;
            this.clearStatus()
            api.blacklab.getFormatContent(this.formatToDownload)
            .then(content => {
                this.setFormatContent(content.configFile);
            }, this.setError)
            .finally(() => this.downloadingFormat = false);
        },

        setFormatContent(content: string) {
            this.formatContent = content;
        },

        onFileChanged(files: FileList, numFiles: number) {
            if (numFiles !== 1 || this.readingFile) {
                return;
            }
            this.readingFile = true;
            const file = files.item(0)!;
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                this.formatContent = reader.result;
                this.readingFile = false;
            };
            reader.onerror = () => this.readingFile = false;
            reader.onabort = () => this.readingFile = false;

            this.$refs.file.clear();
        }
    }
});

</script>

<style lang="scss" scoped>

h3 {
    font-size: 20px;
    font-weight: bold;
    color: #444;
    margin: 8px 0px;
}
</style>