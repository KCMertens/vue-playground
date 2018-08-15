<template>
    <div class="deletebar" v-if="open">
        <template v-if="deleting">deleting...</template>
        <template v-else>
            <div style="overflow: hidden">
                <button type="button" class="fa fa-caret-up" title="close" style="float: right" @click="close"></button>   
                <div style="text-align:center;">delete config panel</div>
            </div>

            Are you sure you want to delete the '{{displayName}}' corpus?<br>
            <button @click="doDelete">OK</button>
            <button @click="close">Cancel</button>
        
            <MessageBox v-if="errorMsg" class="error"
                :title="`Could not delete '${displayName}'`"
                :message="errorMsg.message"
                :dismiss="clearError"
            />
        </template>

    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {ApiError} from '@/types/apptypes';
import * as corporaStore from '@/store/corporastore';

import MessageBox from '@/components/basic/MessageBox.vue';

export default Vue.extend({
    name: 'DeleteBar',
    components: {
        MessageBox,
    },
    props: {
        open: Boolean,
        id: String,
        displayName: String,
    },
    data: () => ({
        deleting: false,

        errorMsg: null as ApiError|null,
    }),
    methods: {
        close() { this.$emit('close'); },

        error(error: ApiError) { this.errorMsg = error; this.deleting = false; },
        clearError() { this.errorMsg = null; },

        doDelete() {
            if (this.deleting) {
                return;
            }

            this.clearError();
            this.deleting = true;
            corporaStore.actions.deleteCorpus({id: this.id})
            .catch(this.error);
       },
    },
});
</script>

<style lang="scss">
.deletebar {
    outline: 1px solid orange;
}
</style>