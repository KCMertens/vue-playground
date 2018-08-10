<template>
    <div class="deletebar" v-if="open">
        <button type="button" class="fa fa-caret-up" title="close" style="float: right" @click="close"></button>   
        <div style="text-align:center;">delete config panel</div>

        Are you sure you want to delete the '{{displayName}}' corpus?<br>
        <button @click="doDelete">OK</button>
        <button @click="close">Cancel</button>
    
        <MessageBox v-if="errorMsg" class="error"
            :title="errorMsg.status"
            :message="errorMsg.message"
            :dismiss="clearError"
        />
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import * as api from '@/api';
import {ApiError} from '@/types/apptypes';

import MessageBox from '@/components/MessageBox.vue';

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

        error(error: ApiError) { this.errorMsg = error; },
        clearError() { this.errorMsg = null; },

        doDelete() {
            if (this.deleting) {
                return;
            }

            this.clearError();
            this.deleting = true;
            api.blacklab.deleteIndex(this.id)
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