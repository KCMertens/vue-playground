<template>

    <div>
        <h2>New document format</h2>
        <div>
            <label for="open_format_file">Open a file from your computer</label>
            <FileInput :disabled="busy" type="text" label="Open a file from your computer" @change="onFileChanged" ref="file"/>
        </div>

        <div>
            <form @submit.prevent="downloadFormat">
                <combo-box filter allow-custom-values v-model="formatToDownload"
                    :options="formatList"
                    placeholder="Choose a format"
                    wrap
                />
                <button type="submit" :disabled="!formatToDownload || busy">download</button>
            </form>
        </div>

        <div>
            <h3>Edit area</h3>
            <label for="format_name">Format name</label><input type="text" id="format_name" v-model="formatName"/>
            <select id="format_type" class="selectpicker" data-width="auto" data-style="btn-primary">
                <option label="YAML" value="yaml" selected>YAML</option>
                <option label="JSON" value="json">JSON</option>
            </select>
            <textarea id="format_editor" style="width:100%;" v-model="formatContent"/>
        </div>


        <div>
            <button type="button" :disabled="busy" @click="save">Save</button>
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

import ComboBox, {OptionGroupList} from '@/components/basic/ComboBox.vue';
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
        formatName: '',
        downloadingFormat: false,
        readingFile: false,
        saving: false
    }),
    computed: {
        formats: formatStore.get.formats,
        formatList(): OptionGroupList {

            const groups: {[key: string]: NormalizedFormat[]} = {};

            (Object.values(this.formats) as NormalizedFormat[])
            .filter(f => f.configurationBased)
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .forEach(f => {
                const g = groups[f.owner || 'Blacklab'] = groups[f.owner || 'Blacklab'] || [];
                g.push(f);
            });

            return Object.entries(groups).map(([key, value]) => ({
                label: key,
                options: value.map(v => ({
                    label: v.displayName,
                    value: v.id
                })),
            }));
        },
        busy() {
            return !this.downloadFormat && !this.readingFile && !this.saving;
        }
    },
    methods: {
        setError(e: ApiError) { this.errorMsg = e; this.successMsg = null; },
        setSuccess(s: BLResponse) { this.successMsg = s; this.errorMsg = null; },
        clearStatus() { this.errorMsg = this.successMsg = null; },

        downloadFormat() {
            if (!this.formatToDownload || this.busy) {
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
            if (numFiles !== 1 || this.busy) {
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

            // @ts-ignore
            this.$refs.file.clear();
        },
        save() {
            if (this.busy) {
                return;
            }

            if (!this.formatContent) {
                this.errorMsg = new ApiError('Cannot save', 'Format is empty', '');
                return;
            } else if (!this.formatName) {
                this.errorMsg = new ApiError('Cannot save', 'Please enter a name', '');
                return;
            }

            this.saving = true;
            this.clearStatus();
            api.blacklab.postFormat(this.formatName, this.formatContent)
            .then(this.setSuccess, this.setError)
            .finally(() => this.saving = false);
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