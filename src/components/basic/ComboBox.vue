<template>
    <!-- TODO classes to allow styling overrides -->
    <div class="dropdown">
        <input type="text" v-model="uservalue" :placeholder="placeholder" 
            ref="input"
            
            @focus="open"
            @keydown.prevent.down="focusDown"
            @keydown.prevent.up="focusUp"
            @keydown.prevent.esc="close"
            @keydown.tab="close"
            @keydown.shift.tab="close"
        />
    
        <ul v-if="isOpen">
            <li v-for="option in filteredOptions" 
                tabindex="-1"

                ref="li"
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

/*
    press down to enter the autocomplete list
    then tabbing will keep you in there
    pressing tab to go to the next input should work as normal though
*/

import Vue from 'vue';
export default Vue.extend({
    name: 'ComboBox',
    props: {
        options: Array as () => Array<{value: string, label?: string}>,
        placeholder: String as () => string,
        filter: Boolean,
    },
    data: () => ({
        isOpen: false,
        uservalue: null as string|null,
        focusIndex: null as number|null,
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
            return this.uservalue ? this.uservalue.toLowerCase() : null;
        },
        
        filteredOptions(): any[] {
            if (!this.filter) {
                return this.options;
            }
            
            const v = this.filterableValue;
            const opts: any[] = this.filterableOptions; // bleh

            return v ? opts.filter(o => o.lowerValue.indexOf(v) >= 0 || o.lowerLabel.indexOf(v) >= 0) : opts;

            // return this.filterableOptions.filter(f => f.lowerValue.indexOf(this.uservalue))
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
            // debugger;
            const numOptions = this.filteredOptions.length;
            if (numOptions === 0) {
                return;
            }
            const focusIndex = this.focusIndex = this.focusIndex === null ? 0 : (this.focusIndex + 1) % numOptions;

            if (!this.isOpen) {
                this.open();
                Vue.nextTick(() => {
                    (this.$refs.li as HTMLElement[])[focusIndex].focus();
                });
            } else {
                (this.$refs.li as HTMLElement[])[focusIndex].focus();
            }
        },
        focusUp() {
            // debugger;
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
                    (this.$refs.li as HTMLElement[])[focusIndex].focus();
                });
            } else {
                (this.$refs.li as HTMLElement[])[focusIndex].focus();
            }
        },
        select(val: string) {
            this.uservalue = val;
            this.close();
        }
    },
});

</script>

<style lang="scss" scoped>

.dropdown {

    position: relative;

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