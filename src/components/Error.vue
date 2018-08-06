<template>
    <div v-if="error" :class="['error', {'styled': !unstyled}]">
        <div class="title">{{message}} ({{error.title}} - {{error.statusText}})</div>
        <div class="message">{{error.message}}</div>
        <button v-if="retry" @click="retry">retry</button>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {ApiError} from '@/types/apptypes';

export default Vue.extend({
    name: 'Error',
    props: {
        error: Object as () => ApiError,
        unstyled: Boolean,
        message: String,
        retry: Function as () => void,
    },
});
</script>

<style lang="scss">

.error {
    &.styled {
        border: 1px solid #ffc0c0;
        border-radius: 6px 6px 0px 0px;
        box-shadow: 0px 1px 3px 1px rgba(0,0,0,0.15), 0px 3px 5px 3px rgba(0,0,0,0.08);
        text-align: left;
        >.title {
            background-color: #ffe4e4;
            border-bottom: 1px solid #ffc0c0;
            border-radius: 6px 6px 0px 0px;
            padding: 12px 15px;
        }
        >.message {
            padding: 25px 15px 15px;
        }
    }
    
    >.message {
        white-space: pre-wrap;
        word-wrap: break-word;
    }
}
</style>