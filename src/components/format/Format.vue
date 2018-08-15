<template>

    <div>
        <div v-if="deleting">
            Deleting...
        </div>

        <div class="format">
            <span class="id" :title="format.shortId">{{format.shortId}}</span>
            <span class="name" :title="format.displayName">{{format.displayName}}</span>

            <div class="buttons">
                <button type="button" class="fa fa-pen" @click="$router.push(`format/edit/${format.id}`)"/>
                <template v-if="format.owner === user.id">
                    <button type="button" class="fa fa-times" @click="deleteconfirm = !deleteconfirm"/>
                </template>
            </div>
        </div>

        <div v-if="deleteconfirm">
            Delete the {{format.shortId}} format?<br>
            <i>This cannot be undone!</i>

            <button type="button" @click="deleteFormat">OK</button>
            <button type="button" @click="deleteconfirm = false">Cancel</button>
        </div>

        <MessageBox class="error" v-if="errorMsg"
            :title="errorMsg.title"
            :message="errorMsg.message"

            @retry="deleteFormat" 
            @dismiss="clearError"
        />
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

import {NormalizedFormat, ApiError} from '@/types/apptypes';

import * as formatStore from '@/store/formatstore';
import * as userStore from '@/store/userstore';

export default Vue.extend({
    name: 'Format',
    props: {
        id: String,
    },
    computed: {
        user: userStore.get.user,
        format(): NormalizedFormat { return formatStore.get.format()(this.id)!; },
    },
    data: () => ({
        deleting: false,
        deleteconfirm: false,
        errorMsg: null as ApiError|null
    }),
    methods: {
        setError(e: ApiError) { this.errorMsg = e; },
        clearError() { this.errorMsg = null; },

        deleteFormat() {
            this.deleting = true;
            formatStore.actions.delete({id: this.id})
            .then(() => {
                this.deleting = false;
                this.clearError();
            },
            this.setError);

        },
    }
});
</script>

<style lang="scss" scoped>
.format{
    display: flex;
    flex-wrap: nowrap;

    &:not(.expand) {
        >.id,
        >.name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
    &.expand {
        word-wrap: break-word;
    }

    >.id {
        flex-grow: 1;
        width: 75px;
        min-width: 75px;
        padding-right: 5px;
    }
    >.name {
        width: 75px;
        min-width: 75px;
        flex-grow: 5;
        padding-right: 5px;
    }
    >.buttons {
        flex: 0 0 75px;
    }
}
</style>