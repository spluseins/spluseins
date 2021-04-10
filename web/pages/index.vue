<template>
  <v-container
    v-touch="{
      right: () => setSidenav(true)
    }"
    fluid
  >
    <v-row
      dense
    >
      <v-col
        cols=12
        md=6
        order="first"
      >
        <v-row
          no-gutters
          class="fill-height"
        >
          <v-col
            cols=12
            class="mb-md-1"
          >
            <upcoming-lectures-card />
          </v-col>

          <v-col
            cols=12
            class="mt-md-1"
            v-show="!$vuetify.breakpoint.mobile"
          >
            <faculty-news-card />
          </v-col>
        </v-row>
      </v-col>

      <v-col
        cols=12
        md=6
        order-md=2
        order="last"
      >
        <campus-news-card />
      </v-col>

      <v-col
        v-show="$vuetify.breakpoint.mobile"
        order=4
      >
        <faculty-news-card />
      </v-col>

      <v-col
        v-show="displayMensaCard"
        cols=12
        md=6
        :lg="hasSubscribableTimetables ? 4 : 6"
        order=3
        order-md=4
      >
        <mensa-card />
      </v-col>

      <v-col
        v-show="hasSubscribableTimetables"
        cols=12
        md=6
        :lg="displayMensaCard ? 4 : 6"
        order=5
      >
        <stats-card />
      </v-col>

      <v-col
        v-show="hasSubscribableTimetables"
        cols=12
        md=6
        :lg="displayMensaCard ? 4 : 6"
        order=2
        order-md=3
      >
        <quick-access-card />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import UpcomingLecturesCard from '../components/upcoming-lectures-card.vue';
import QuickAccessCard from '../components/quick-access-card.vue';
import MensaCard from '../components/mensa-card.vue';
import CampusNewsCard from '../components/campus-news-card.vue';
import FacultyNewsCard from '../components/faculty-news-card.vue';
import StatsCard from '../components/stats-card.vue';

export default {
  name: 'IndexPage',
  components: {
    UpcomingLecturesCard,
    QuickAccessCard,
    MensaCard,
    CampusNewsCard,
    FacultyNewsCard,
    StatsCard
  },
  computed: {
    displayMensaCard () {
      if (this.mensaPlans.length == 0) {
        return false;
      }
      // display if next plan is from today or from tomorrow
      return this.$dayjs().isSame(this.mensaPlans[0].date, 'day') || this.$dayjs().add(1, 'days').isSame(this.mensaPlans[0].date, 'day');
    },
    ...mapState({
      mensaPlans: (state) => state.mensa.plans
    }),
    ...mapGetters({
      hasSubscribableTimetables: 'splus/hasSubscribableTimetables'
    })
  },
  head () {
    return {
      title: 'Startseite',
      meta: [
        { hid: 'description', name: 'description', content: 'SplusEins – Stundenplan und Mensaplan für Studenten der Ostfalia. Schaue Pläne der Ostfalia und Mensa Ostfalia an.' },
        { hid: 'og:description', property: 'og:description', content: 'SplusEins – Stundenplan und Mensaplan für Studenten der Ostfalia. Schaue Pläne der Ostfalia und Mensa Ostfalia an.' }
      ]
    };
  },
  methods: {
    ...mapMutations({
      setSidenav: 'ui/setSidenav'
    })
  },
  middleware: 'cached'
};
</script>
