<template>
  <v-sheet class="fill-height">
    <spluseins-calendar />
  </v-sheet>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import SpluseinsCalendar from '../../components/spluseins-calendar.vue';

export default {
  name: 'TimetablePage',
  head () {
    return {
      title: this.isCustomSchedule ? 'Stundenplan' : this.schedule.longDescription,
      meta: [
        { hid: 'description', name: 'description', content: this.isCustomSchedule ? 'Stundenplan' : this.schedule.longDescription },
        { hid: 'og:description', property: 'og:description', content: this.isCustomSchedule ? 'Stundenplan' : this.schedule.longDescription }
      ]
    };
  },
  components: {
    SpluseinsCalendar
  },
  computed: {
    ...mapGetters({
      isCustomSchedule: 'splus/isCustomTimetable'
    }),
    ...mapState({
      schedule: (state) => state.splus.schedule
    })
  },
  methods: {
    ...mapActions({
      importSchedule: 'splus/importSchedule'
    })
  },
  mounted () {
    // Import custom schedule manually on client-side after vuex-persist is ready. Workaround for https://github.com/championswimmer/vuex-persist/issues/119
    setTimeout(() => { this.importSchedule({ params: this.$route.params, query: this.$route.query, importCustomSchedule: true }); }, 10);
  },
  async fetch ({ store, params, query, error }) {
    // import the schedule, but don't store custom schedules yet, because we can be on the server side here
    store.dispatch('splus/importSchedule', { params, query, importCustomSchedule: false });
    store.commit('splus/resetWeek', process.static);

    if (store.state.splus.schedule === undefined) {
      error({ statusCode: 404, message: 'Plan existiert nicht' });
      return;
    }

    if (!store.state.lazyLoad) {
      await store.dispatch('splus/load');
    }
  },
  middleware: 'cached',
  watchQuery: ['id', 'name', 'course'], // rerender page when query params change
  key: to => to.fullPath // rerender full path
};
</script>
