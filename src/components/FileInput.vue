<template>
    <div class="file-input">
        <label :for="id">{{label}}</label>
        <input 
            type="file"
            multiple 
            
            ref="input"
            :id="id"
            @change="change"/>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    data: () => ({
        id: Math.random().toString(),
        files: null as FileList|null,
        fileCount: null as number|null
    }),
    computed: {
        label(): string {
            switch (this.fileCount) {
                case null: return 'No files selected';
                case 1: return this.files!.item(0)!.name;
                default: return this.fileCount + ' files selected';
            }
        }
    },
    methods: {
        clear() {
            (this.$refs.input as HTMLInputElement).files = null;
            this.change();
        },
        change() {
            this.files = (this.$refs.input as HTMLInputElement).files;
            this.fileCount = this.files && this.files.length > 0 ? this.files.length : null;
            this.$emit('change', this.files, this.fileCount);
        },
        getFiles() { return this.files; },
        getFileCount() { return this.fileCount; },
    }
});

</script>

<style lang="scss">
.file-input {
    position: relative;
    // overflow: hidden;
    display: inline-block;
    color: #444;
    &+.file-input {
        margin-left: 10px;
    }

    label {
        background-color: hsl(180, 45%, 80%);
        border: 1px solid hsl(180, 45%, 60%);
        padding: 12px 16px;
        display: inline-block;
        border-radius: 6px;
    }

    input {
        font-size: 0;
        width: 0;
        height: 0;
        opacity: 0;
        position: absolute;
        left: -100;
        top: 0;
        z-index: -1
    }
}
</style>