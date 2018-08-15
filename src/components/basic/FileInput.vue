<template>
    <div class="file-input">
        <label :for="id">{{dynamicLabel}}</label>
        <input
            ref="input"
            type="file"

            v-bind="getInputAttrs"
            v-on="getInputListeners"/>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    inheritAttrs: false,
    props: {
        label: String as () => string,
        multiple: Boolean,
        id: {
            type: String,
            default() { return Math.random().toString(); },
        } as any as () => string, // Typescript has some rough edges...
    },
    data() {
        return {
            files: null as FileList|null,
            fileCount: null as number|null
        };
    },
    computed: {
        /* tslint:disable */ // silence type warning on Function...
        getInputListeners(): { [key: string]: Function|Function[] } {
            return Object.assign({}, this.$listeners, {
                // @change on this component (defined in our parent) should not listen to events directly from the file input
                // Override it with our own @change listener that then delegates
                change: this.change
            });
        },
        /* tslint:enable */

        getInputAttrs(): any {
            return Object.assign({}, this.$attrs, {
                // Explicit props of this component are not contained in $attrs, so we need to re-insert them
                id: this.id,
                multiple: this.multiple,
            });
        },

        dynamicLabel(): string {
            switch (this.fileCount) {
                case null: return this.label || (this.multiple ? 'No files selected' : 'Select file');
                case 1: return this.files!.item(0)!.name;
                default: return this.fileCount + ' files selected';
            }
        }
    },
    methods: {
        clear() {
            (this.$refs.input as HTMLInputElement).value = '';
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
        cursor: pointer;
    }

    input {
        font-size: 0;
        word-spacing: 0;
        line-height: 0;
        width: 0;
        min-width: 0;
        height: 0;
        min-height: 0;
        border: none;
        padding: 0;
        margin: 0;
        opacity: 0;
        position: absolute;
        left: -100px;
        top: -100px;
        z-index: -100
    }
}
</style>