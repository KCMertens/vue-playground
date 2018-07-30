<template>
  <div id="app" v-if="appConfig">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
  </div>
  <div v-else>
    Loading... (spinner here)
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import * as Api from '@/api';

export default Vue.extend ({
  name: 'App',
  data: () => ({
    appConfig: null,
  }),

  beforeCreate() {
    const self = this;
    Api.getAppConfig().then((config) => {
      self.$data.appConfig = config;
    });
  },
});
</script>


<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
