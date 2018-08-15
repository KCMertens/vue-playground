<template>

    <div>
        <h2>New document format</h2>
        <div>
            <label for="open_format_file">Open a file from your computer</label>
            <input type="file" id="open_format_file" title="Open a file from your computer"/>
        </div>
        
        <div>
            <label for="format_select">Open an existing format</label>
            <combo-box 
                :options="formatList.map(f => ({label: f.displayName, value: f.id}))"
                filter
                placeholder="Choose a format"
            />
            
            <button>download</button>
            <div>TODO needs combobox feature</div>
        </div>
        
        <div>
            <h3>Edit area</h3>
                <!-- name, type -->
            <label for="format_name">Format name</label><input type="text" id="format_name"/>
            <select id="format_type" class="selectpicker" data-width="auto" data-style="btn-primary">
                <option label="YAML" value="yaml" selected>YAML</option>
                <option label="JSON" value="json">JSON</option>
            </select>
            <textarea id="format_editor" style="width:100%;"/>
        </div>

        <div id="format_error" class="alert alert-danger">Error message goes here</div>

        <div>
            <button type="button">OK</button>
            <button type="button" >Cancel</button>
        </div>
        <h5 class="pull-left"><span class="fa fa-question-circle text-muted"></span> <a href="http://inl.github.io/BlackLab/how-to-configure-indexing.html" target="_blank" style="font-weight: bold">How to write your own format</a></h5>


        


    </div>


</template>

<script lang="ts">
import Vue from 'vue';

import * as formatStore from '@/store/formatstore';

import ComboBox from '@/components/basic/ComboBox.vue';

import {NormalizedFormat} from '@/types/apptypes';

export default Vue.extend({
    name: 'CreateFormat',
    components: {
        ComboBox
    },
    computed: {
        formats: formatStore.get.formats,
        formatList(): NormalizedFormat[] {
            return (Object.values(this.formats) as NormalizedFormat[])
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
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