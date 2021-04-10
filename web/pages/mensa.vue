<template>
  <v-container
    fluid
    :show-arrows="false"
    class="pa-md-7"
  >
    <div class="text-h5">
      Mensa Wolfenbüttel
    </div>
    <div class="text-body-2">
      <a href="https://www.stw-on.de/wolfenbuettel/essen/mensa/#c2368">Offizielle Mensa-Seite mit Öffnungszeiten</a>
    </div>
    <div class="text-body-2 text--secondary d-flex">
      <div class="d-flex pr-4">
        Vegetarisch
        <v-icon
          :color="getIconColor()"
          small
          class="align-self-center ml-1"
        >
          {{ mdiLeaf }}
        </v-icon>
      </div>
      <div class="d-flex">
        Vegan
        <v-icon
          color="green"
          small
          class="align-self-center ml-1"
        >
          {{ mdiLeaf }}
        </v-icon>
      </div>
    </div>
    <v-divider class="my-1" />
    <client-only>
      <v-carousel
        v-if="hasAvailabePlans"
        :show-arrows="!$vuetify.breakpoint.mobile"
        :hide-delimiters="!$vuetify.breakpoint.mobile"
        hide-delimiter-background
        :light="!this.$vuetify.theme.dark"
        height="100%"
      >
        <template v-if="$vuetify.breakpoint.mobile">
          <v-carousel-item
            v-for="dayPlan in plans"
            :key="dayPlan.date"
          >
            <v-col
              class="carousel-delimiter-padding"
            >
              <mensa-dayplan :plan="dayPlan" />
            </v-col>
          </v-carousel-item>
        </template>
        <template v-if="!$vuetify.breakpoint.mobile">
          <v-carousel-item
            v-for="dayPlanGroup in groupedDayPlans"
            :key="dayPlanGroup[0].date"
          >
            <v-row
              dense
              class="carousel-control-padding"
            >
              <v-col>
                <mensa-dayplan
                  :plan="dayPlanGroup[0]"
                />
              </v-col>
              <v-col>
                <mensa-dayplan
                  v-if="dayPlanGroup[1]"
                  :plan="dayPlanGroup[1]"
                />
              </v-col>
              <v-col>
                <mensa-dayplan
                  v-if="dayPlanGroup[2]"
                  :plan="dayPlanGroup[2]"
                />
              </v-col>
            </v-row>
          </v-carousel-item>
        </template>
      </v-carousel>
      <v-alert
        v-if="!hasAvailabePlans"
        type="info"
        class="my-6"
      >
        Aktuell sind keine Pläne verfügbar.
      </v-alert>
    </client-only>

    <span class="pt-1 d-flex justify-end text-caption text--secondary">
      Quelle: openmensa.org
    </span>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex';
import MensaDayplan from '../components/mensa-dayplan.vue';
import { mdiLeaf } from '@mdi/js'

export default {
  name: 'MensaPage',
  head () {
    return {
      title: 'Mensaplan',
      meta: [
        { hid: 'description', name: 'description', content: 'Mensaplan' },
        { hid: 'og:description', property: 'og:description', content: 'Mensaplan' }
      ]
    };
  },
  data () {
    return {
      mdiLeaf
    }
  },
  components: {
    MensaDayplan
  },
  computed: {
    ...mapState({
      plans: (state) => state.mensa.plans,
      lazyLoad: (state) => state.lazyLoad
    }),
    groupedDayPlans () {
      const grouped = [];
      for (let i = 0; i < this.plans.length; i += 3) {
        grouped.push(this.plans.slice(i, i + 3));
      }
      return grouped;
    },
    hasAvailabePlans () {
      return this.plans.length > 0;
    }
  },
  mounted () {
    if (this.lazyLoad) {
      // static build -> no mensa plan is in the store
      this.load();
    }
  },
  methods: {
    ...mapActions({
      load: 'mensa/load'
    }),
    ...mapMutations({
      setSidenav: 'ui/setSidenav'
    }),
    getIconColor (item) {
      if (item === undefined || item.notes.includes('Vegetarisch')) {
        return this.$vuetify.theme.dark ? 'white' : 'black';
      } else if (item.notes.includes('Vegan')) {
        return 'green';
      }
    }
  },
  middleware: 'cached'
};
</script>

<style lang="scss">

.v-carousel {
  box-shadow: none !important;
}

.carousel-delimiter-padding {
  padding-bottom: 40px;
}

.carousel-control-padding {
  padding: 0 50px;
  margin: 0px !important;
}

.v-carousel__controls {
  height: 40px !important;
}

.v-window__prev, .v-window__next {
  margin: 0 !important;
}
</style>
