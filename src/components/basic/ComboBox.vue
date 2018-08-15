<template>
    <!-- TODO classes to allow styling overrides -->
    <div class="dropdown">
        <input type="text"
            ref="input"

            :placeholder="placeholder"
            v-model="currentValue"

            @focus="open"
            @click="open"
            @keydown.prevent.down="focusDown"
            @keydown.prevent.up="focusUp"
            @keydown.prevent.esc="close"
            @keydown.tab="close"
        />

        <ul v-show="isOpen" ref="ul">
            <li v-for="option in filteredOptions"
                tabindex="-1"

                :key="option.value"
                :title="option.value"
                @click="select(option.value)"
                @keydown.prevent.enter="select(option.value)"
                @keydown.prevent.tab="focusDown"
                @keydown.prevent.down="focusDown"
                @keydown.prevent.tab.shift="focusUp"
                @keydown.prevent.up="focusUp"
                @keydown.prevent.esc="close"
            >
                {{option.label || option.value}}
            </li>
        </ul>

        <div v-if="isOpen && filteredOptions.length" class="backdrop" @click="close"/>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'ComboBox',
    props: {
        options: Array as () => Array<{value: string, label?: string}>,
        placeholder: String as () => string,
        filter: Boolean,
        value: String as () => string,
    },
    data: () =>  ({
        isOpen: false,
        focusIndex: null as number|null,
        currentValue: '' // synced with actual input
    }),
    computed: {
        filterableOptions(): Array<{value: string, label: string, lowerValue: string, lowerLabel: string}> {
            return this.options.map(o => ({
                value: o.value,
                label: o.label || o.value,
                lowerValue: o.value.toLowerCase(),
                lowerLabel: (o.label || o.value).toLowerCase()
            }));
        },
        filterableValue(): string|null {
            return this.currentValue ? this.currentValue.toLowerCase() : null;
        },

        filteredOptions(): any[] {
            const opts: any[] = this.filterableOptions; // bleh
            const v = this.filterableValue;
            if (!this.filter || !v) {
                return opts;
            }

            return opts.filter(o => o.lowerValue.indexOf(v) >= 0 || o.lowerLabel.indexOf(v) >= 0);
        }
    },
    methods: {
        open() {
            this.isOpen = true;
        },
        close() {
            (this.$refs.input as HTMLElement).focus();
            this.isOpen = false;
            this.focusIndex = null;
        },
        focusDown() {
            const numOptions = this.filteredOptions.length;
            if (numOptions === 0) {
                return;
            }
            const focusIndex = this.focusIndex = this.focusIndex === null ? 0 : (this.focusIndex + 1) % numOptions;

            if (!this.isOpen) {
                this.open();
                Vue.nextTick(() => {
                    ((this.$refs.ul as HTMLElement).children[focusIndex] as HTMLElement).focus();
                // (this.$refs.li as HTMLElement[])[focusIndex].focus();
                });
            } else {
                ((this.$refs.ul as HTMLElement).children[focusIndex] as HTMLElement).focus();
            }
        },
        focusUp() {
            const numOptions = this.filteredOptions.length;
            if (numOptions === 0) {
                return;
            }
            const focusIndex = this.focusIndex = this.focusIndex === null ?
                numOptions - 1 :
                (this.focusIndex + numOptions - 1) % numOptions;

            if (!this.isOpen) {
                this.open();
                Vue.nextTick(() => {
                    ((this.$refs.ul as HTMLElement).children[focusIndex] as HTMLElement).focus();
                });
            } else {
                ((this.$refs.ul as HTMLElement).children[focusIndex] as HTMLElement).focus();
            }
        },
        select(val: string) {
            this.currentValue = val;
            Vue.nextTick(this.close);
        }
    },
    watch: {
        value: {
            immediate: true,
            handler(newVal) {
                this.currentValue = newVal;
            }
        },
        currentValue(newValue) {
            if (this.value !== newValue) {
                this.$emit('input', newValue);
                this.open();
            }
        }
    }
});

</script>

<style lang="scss" scoped>

.dropdown {

    position: relative;
    display: inline-block;

    >input {
        z-index: 1000;
    }

    >ul {
        background: white;
        box-shadow: 0px 2px 5px -2px black, 0px 4px 9px -4px rgba(0,0,0,0.5);
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 4px;
        margin-top: 4px;
        padding: 10px 4px;
        position: absolute;
        top: auto;
        width: auto;
        max-width: 100%;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;

        &:empty {
            display: none;
        }

        >li {
            padding: 4px 12px;
            cursor: pointer;
            &:hover,
            &:focus,
            &:active {
                background: #eee;
                color: #292929;
            }

        }
    }
}

.backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;

    // background: rgba(255,0,0,0.1);
}

</style>