<template>
    <div v-if="error" :class="['error', {'styled': !unstyled}]">
        <div class="title">{{message || error.title}} (code {{error.code}})</div>
        <div class="message">{{error.message}}</div>
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
    },
});
</script>

<style lang="scss">
.error.styled {
    border: 1px solid #ffc0c0;
    border-radius: 6px 6px 0px 0px;
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
</style>