<template>
  <v-navigation-drawer
    v-model="drawer"
    v-touch="{
      left: () => drawer = false
    }"
    clipped
    fixed
    app
    width="350"
  >
    <basic-utilities-list />
    <v-divider v-if="hasCustomTimetables" />
    <custom-timetables-list v-if="hasCustomTimetables" />
    <v-divider v-if="hasFavoriteTimetables" />
    <favorite-timetables-list v-if="hasFavoriteTimetables" />
    <v-divider />
    <general-timetables-list />
    <client-only>
      <install-button-list
        class="stick-bottom"
      />
    </client-only>
  </v-navigation-drawer>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import GeneralTimetablesList from './general-timetables-list.vue';
import FavoriteTimetablesList from './favorite-timetables-list.vue';
import CustomTimetablesList from './custom-timetables-list.vue';
import InstallButtonList from './install-button-list.vue';
import BasicUtilitiesList from './basic-utilities-list.vue';

export default {
  name: 'SpluseinsSideNav',
  components: {
    GeneralTimetablesList,
    FavoriteTimetablesList,
    CustomTimetablesList,
    InstallButtonList,
    BasicUtilitiesList
  },
  computed: {
    drawer: {
      get () { return this.sidenavIsOpen; },
      set (val) { this.setSidenav(val) }
    },
    hasCustomTimetables () {
      return JSON.stringify(this.customSchedules) != '{}';
    },
    hasFavoriteTimetables () {
      return this.favoriteSchedules.length > 0;
    },
    ...mapState({
      customSchedules: (state) => state.splus.customSchedules,
      favoriteSchedules: (state) => state.splus.favoriteSchedules,
      sidenavIsOpen: (state) => state.ui.sidenavIsOpen,
      browserStateReady: (state) => state.browserStateReady
    })
  },
  methods: {
    ...mapMutations({
      setSidenav: 'ui/setSidenav'
    })
  }
};
</script>

<style lang="scss">
.stick-bottom {
  position: sticky;
  bottom: 0;
}

</style>
