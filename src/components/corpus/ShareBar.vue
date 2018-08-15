<template>

    <div class="sharebar" v-if="open">
        <div style="overflow: hidden">
            <button type="button" class="fa fa-caret-up" title="close" style="float: right" @click="close"/>
            <div style="text-align:center;">share config panel</div>
        </div>

        <div v-if="loading">Loading...</div>
        <div v-if="users">
            <div v-for="(share, index) in users" :key="index">
                <input type="text" 
                    v-model="share.value"
                    v-focus-on-create
                    :disabled="busy"
                    @keydown.enter="addUser"
                    @change="changed = true"
                />
                <button class="fa fa-times" type="button" 
                    :disabled="busy" 
                    @click="removeUser(index);"/>
            </div>

            <div class="controls">
                <button type="button" :disabled="busy" @click="addUser" class="fa fa-plus"/>
                <button type="button" :disabled="busy || !users.length" @click="clearUsers">remove all</button>

                <button type="button" :disabled="busy || !changed" @click="load">undo unsaved changes</button>
                <button type="button" :disabled="busy || !changed" @click="save">save changes</button>
            </div>
        </div>

        <MessageBox v-if="errorMsg" class="error"
            title="Could not load shared users"
            :message="errorMsg.message"
            :retry="load"
        />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import * as api from '@/api';
import {ApiError} from '@/types/apptypes';

import MessageBox from '@/components/basic/MessageBox.vue';

export default Vue.extend({
    name: 'ShareBar',
    components: {
        MessageBox,
    },
    props: {
        open: Boolean,
        id: String
    },
    computed: {
        saving(): boolean { return this.state === 'saving'; },
        loading(): boolean { return this.state === 'loading'; },
        busy(): boolean { return this.saving || this.loading; },
    },
    data: () => ({
        users:  null as Array<{value: string}>|null,
        changed: false,
        state: null as ('saving'|'loading')|null,

        errorMsg: null as ApiError|null,
    }),
    methods: {
        close() { this.$emit('close'); },

        error(error: ApiError) { this.errorMsg = error; },
        clearError() { this.errorMsg = null; },

        addUser()               { if (!this.users) { return; } this.users.push({value: ''}); this.changed = true; },
        removeUser(i: number)   { if (!this.users) { return; } this.users.splice(i, 1); this.changed = true; },
        clearUsers()            { if (!this.users) { return; } this.users = []; this.addUser(); },

        load() {
            if (this.busy) {
                return;
            }

            this.clearError();
            this.state = 'loading';
            api.blacklab
            .getShares(this.id)
            .then(shares => {
                this.users = shares.map(s => ({ value: s }));
                this.state = null; // do before adding user or focus won't shift
                this.addUser();
                this.changed = false; // undo dirty flag since this wasn't a user-generated edit
            })
            .catch(this.error)
            .finally(() => this.state = null);
        },
        save() {
            if (this.busy) {
                return;
            }

            this.state = 'saving';
            api.blacklab
            .postShares(this.id, this.users!.map(i => i.value))
            .then(response => {
                this.changed = false;
            })
            .catch(this.error)
            .finally(() => this.state = null);
        }
    },
    watch: {
        open: {
            immediate: true,
            handler(newVal, oldVal) {
                if (newVal && this.users === null && this.errorMsg == null) {
                    this.load();
                }
            }
        },
    },
    directives: {
        focusOnCreate: {
            inserted(el) { el.focus(); },
            update(el) { el.focus(); },
        }
    }
});
</script>

<style lang="scss">
.sharebar {
    outline: 1px solid lightgreen;
}
</style>