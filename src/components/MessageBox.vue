<template >
    <div class="messagebox">
        <div class="header">
            <span class="title">{{title}}</span>
            <button type="button" v-if="dismiss" class="dismiss fa fa-times" @click="dismiss"></button>
        </div>
        <div class="body">
            <span class="message">{{message}}</span>
            <button type="button" v-if="retry" class="retry" @click="retry">retry</button>
        </div>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'MessageBox',
    props: {
        title: String,
        message: String,
        dismiss: Function as () => void,
        retry: Function as () => void,
    },
});
</script>

<style lang="scss" scoped>

$colors: (
    message: hsl(0, 0%, 20%),
    error: hsl(355, 90%, 26%),
    success: hsl(115, 90%, 26%),
);

.messagebox {
    border-width: 1px;
    border-style: solid;
    // TODO mixin inset box-shadow strong
    box-shadow: inset 0px 3px 6px 0px rgba(0,0,0,0.4);
    text-shadow: 1px 1px 3px black;
}

.header {
    padding: 8px 12px 4px;
    border-bottom: 1px solid;
    border-color: inherit;
    background-color: rgba(0,0,0,0.25);
    box-shadow: 0px 1px 3px -1px rgba(0,0,0,0.2); // TODO mixin outset box-shadow subtle
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;
}
.dismiss {
    background: none;
    border: 1px solid;
    border-radius: 100px;
    box-sizing: content-box;
    color: inherit;
    cursor: pointer;
    font-size: 100%;
    height: 1em;
    padding: 0;
    width: 1em;
}

.body {
    padding: 25px 15px 15px;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.message {
    display: block;
}

@function brightness($color) {
    @return ((red($color) * .299) + (green($color) * .587) + (blue($color) * .114)); 
}

@function clamp($value, $min, $max) {
  @return if($value > $max, $max, if($value < $min, $min, $value));
}

@each $class, $color in $colors {
    $l: lightness($color);
    
    .messagebox.#{$class} {
        background: $color;
        border-color: scale-color($color, $lightness: -50%);
        background: linear-gradient(
            to bottom, 
            change-color($color, $lightness: clamp(1.25*$l, 0, 100))    0%, 
            $color                                                      45%, 
            change-color($color, $lightness: clamp(0.85*$l, 0, 100))    100%
        );
        color: scale-color($color, $lightness: if($l >= 50%, -92%, 92%)) 
    }
}
</style>
