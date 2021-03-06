<template>
    <div class="combobox"> <!-- classes and styles attached to <ComboBox/> are attached here automatically -->
        <input v-if="allowCustomValues" type="text"
            ref="input"

            @focus="open"
            @click="open"
            @keydown.prevent.down="focusDown"
            @keydown.prevent.up="focusUp"
            @keydown.prevent.esc="close"
            @keydown.tab="close"

            v-model="currentValue"
            v-bind="$attrs"
            v-on="getInputListeners"
        /> <!-- other event handlers and other unknown attributes are passed on through v-bind and v-on respecively -->
        <button v-else
            @focus="open"
            @click="isOpen ? open() : close();"
            @keydown.prevent.down="focusDown"
            @keydown.prevent.up="focusUp"
            @keydown.prevent.esc="close"
            @keydown.tab="close"
            >
            <span v-if="currentValue">{{currentValue}} </span>
            <span v-else class="placeholder">{{$attrs.placeholder || 'Select a value'}} </span>
            <span :class="['fa', {'fa-caret-down': !(isOpen && hasVisibleOptions), 'fa-caret-up': isOpen && hasVisibleOptions}]"/>
        </button>

        <ul :class="['menu', {'wrap': wrap}]" v-show="isOpen && hasVisibleOptions" ref="ul">
            <!-- empty option in case user can't type -->
            <li v-if="!allowCustomValues"
                class="option"
                tabindex="-1"

                key="&nbsp;"
                title="&nbsp;"
                @click="select('')"
                @keydown.prevent.enter="select('')"
                @keydown.prevent.tab="$event.shiftKey ? focusUp() : focusDown()"
                @keydown.prevent.down="focusDown"
                @keydown.prevent.up="focusUp"
                @keydown.prevent.esc="close"
            >&nbsp;</li>

            <li v-for="option in filteredOptions.ungrouped"
                class="option"
                tabindex="-1"

                :key="option.value"
                :title="option.value"
                @click="select(option.value)"
                @keydown.prevent.enter="select(option.value)"
                @keydown.prevent.tab="$event.shiftKey ? focusUp() : focusDown()"
                @keydown.prevent.down="focusDown"
                @keydown.prevent.up="focusUp"
                @keydown.prevent.esc="close"
            >{{option.label}}</li>

            <template v-for="(group, index) in filteredOptions.groups">
                <li class="optiongroup" :key="index" tabindex="-1" :title="group.label">{{group.label}}</li>

                <li v-for="option in group.options"
                    class="option"
                    tabindex="-1"

                    :key="option.value"
                    :title="option.value"
                    @click="select(option.value)"
                    @keydown.prevent.enter="select(option.value)"
                    @keydown.prevent.tab="$event.shiftKey ? focusUp() : focusDown()"
                    @keydown.prevent.down="focusDown"
                    @keydown.prevent.up="focusUp"
                    @keydown.prevent.esc="close"
                >{{option.label}}</li>
            </template>
        </ul>

        <div v-if="isOpen && hasVisibleOptions" class="backdrop" @click="close"/>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';

export type SimpleOptionList = string[];
export type Option = {
    value: string;
    label?: string;
};
export type OptionList = Option[];
export type OptionGroup = {
    label: string;
    options: OptionList;
};
export type OptionGroupList = OptionGroup[];

type FilterableOption = {
    value: string;
    label: string;
    lowerValue: string;
    lowerLabel: string;
};

type FilteredOptions = {
    ungrouped: FilterableOption[];
    groups: Array<{
        label: string;
        options: FilterableOption[];
    }>;
};


function isSimpleOption(e: any): e is string { return typeof e === 'string'; }
function isSimpleOptionList(e: any): e is SimpleOptionList { return e instanceof Array && e.every(isSimpleOption); }
function isOption(e: any): e is Option { return e && isSimpleOption(e.value); }
function isOptionList(e: any): e is OptionList { return e instanceof Array && e.every(isOption); }
function isOptionGroup(e: any): e is OptionGroup { return e && typeof e.label === 'string' && isOptionList(e.options); }
function isOptionGroupList(e: any): e is OptionGroupList { return e instanceof Array && e.every(isOptionGroup); }

export default Vue.extend({
    name: 'ComboBox',
    inheritAttrs: false,
    props: {
        options: Array as () => SimpleOptionList|OptionList|OptionGroupList,
        filter: Boolean, // is the dropdown list filtered by the current value (acts more as an autocomplete)

        value: String as () => string, // for v-bind, or just as initial value
        wrap: Boolean, // are long options line wrapped?
        allowCustomValues: Boolean, // allow typing in the input or only selecting from the list
    },
    data: () =>  ({
        isOpen: false,
        focusIndex: null as number|null,
        currentValue: '' // synced with actual input
    }),
    computed: {
        getInputListeners(): any {
            const listeners = Object.assign({}, this.$listeners);
            // Don't attach @input listener set by v-model from inside our parent component
            // We attach our own v-model listener to the input already
            delete listeners.input;
            return listeners;
        },

        filterableOptions(): FilteredOptions {
            function mapOption(s: Option): FilterableOption {
                return {
                    value: s.value,
                    lowerValue: s.value.toLowerCase(),
                    label: s.label || s.value,
                    lowerLabel: (s.label || s.value).toLowerCase(),
                };
            }

            function mapSimple(s: string) {
                return mapOption({value: s, label: s});
            }

            const ret: FilteredOptions = {
                ungrouped: [],
                groups: [],
            };

            // map all options into normalized objects we can properly use
            if (isSimpleOptionList(this.options)) {
                ret.ungrouped = this.options.map(mapSimple);
            } else if (isOptionList(this.options)) {
                ret.ungrouped = this.options.map(mapOption);
            } else {
                ret.groups = this.options.map(g => ({
                    label: g.label,
                    options: g.options.map(mapOption)
                }));
            }

            return ret;
        },
        filterableValue(): string|null {
            return this.currentValue ? this.currentValue.toLowerCase() : null;
        },

        filteredOptions(): FilteredOptions {
            if (!this.filterableValue || !this.filter) {
                return this.filterableOptions;
            }

            return {
                ungrouped: this.filterableOptions.ungrouped.filter(this.filterOption),
                groups: this.filterableOptions.groups
                    .map(g => ({
                        label: g.label,
                        options: g.options.filter(this.filterOption)
                    }))
                    .filter(g => g.options.length)
            };
        },

        hasVisibleOptions(): boolean {
            return this.filteredOptions.ungrouped.length > 0 || this.filteredOptions.groups.length > 0;
        }
    },
    methods: {
        open() {
            this.isOpen = true;
        },
        close() {
            if (this.$refs.input) {
                (this.$refs.input as HTMLElement).focus();
            }
            this.isOpen = false;
            this.focusIndex = null;
        },
        focusDown() {this.focusOffset(1); },
        focusUp() { this.focusOffset(-1); },
        focusOffset(offset: number) {
            if (!this.hasVisibleOptions) {
                return;
            }

            const ul = this.$refs.ul as HTMLElement;
            const lis = ul.children;

            // start at -1 so first increment rolls to 0
            const inc = this.loopingIncrementor(this.focusIndex != null ? this.focusIndex : -1, lis.length, offset);
            while (lis[inc.next()].classList.contains('optiongroup')) {/*next() is the import part*/}
            this.focus(inc.current);
        },
        focus(i: number) {
            this.focusIndex = i;
            if (!this.isOpen) {
                this.open();
                Vue.nextTick(() => {
                    ((this.$refs.ul as HTMLElement).children[i] as HTMLElement).focus();
                });
            } else {
                 ((this.$refs.ul as HTMLElement).children[i] as HTMLElement).focus();
            }
        },
        select(val: string) {
            this.currentValue = val;
            Vue.nextTick(this.close);
        },

        // Util
        filterOption(o: FilterableOption): boolean {
            return o.lowerValue.indexOf(this.filterableValue!) >= 0 || o.lowerLabel.indexOf(this.filterableValue!) >= 0;
        },
        loopingIncrementor(initial: number, max: number, increment: number) {
            let cur = initial;
            return {
                next() {
                    const next = (cur + increment) % max;
                    cur = next < 0 ? next + max : next;
                    return cur;
                },
                get current() { return cur; }
            };
        },
    },
    watch: {
        value: {
            immediate: true,
            handler(newVal) {
                if (newVal !== this.currentValue) {
                    this.currentValue = newVal;
                }
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

.combobox {

    position: relative;
    display: inline-block;

    .input {
        z-index: 1000;
        position: relative;
    }

    .menu {
        background: white;
        box-shadow: 0px 2px 5px -2px black, 0px 4px 9px -4px rgba(0,0,0,0.5);
        border: 1px solid #ccc;
        margin-top: 3px;
        position: absolute;
        top: auto;
        width: auto;
        max-width: 100%;
        min-width: 300px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;

        >.option {
            padding: 4px 0px 4px 22px;
            color: #4a4a4a;
            cursor: pointer;
            &:hover,
            &:focus,
            &:active {
                background: #eee;
                color: #292929;
            }
        }
        >.optiongroup {
            padding: 8px 0px 4px 12px;
            // background: #f8f8f8;
            color: #777;
            font-size: 14px;

            margin-bottom: 4px;
            border-bottom: 1px solid #ccc;
        }

        &:not(.wrap) {
            >.option,
            >.optiongroup {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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