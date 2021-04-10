<template>
  <v-container
    fluid
    class="pa-1 pa-md-3"
    v-touch="{
      right: () => prev(),
      left: () => next()
    }"
  >
    <v-row
      class="fill-height"
      no-gutters
    >
      <v-col
        cols=12
        class="mb-2 mb-md-4"
      >
        <v-toolbar
          flat
          class="inherit-background-color"
        >
          <responsive-icon-button
            :breakpoint="!$vuetify.breakpoint.mobile"
            :icon="mdiCalendarToday"
            text="Heute"
            @click="setToday"
            class="ml-0"
          />
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                @click="prev"
                class="ml-1"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>{{ mdiChevronLeft }}</v-icon>
              </v-btn>
            </template>
            <span>Vorherige Woche</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                @click="next"
                class="mr-1"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>{{ mdiChevronRight }}</v-icon>
              </v-btn>
            </template>
            <span>Nächste Woche</span>
          </v-tooltip>

          <v-toolbar-title>
            {{ monthSummary }}
          </v-toolbar-title>
          <v-spacer />

          <calendar-action-bar />
        </v-toolbar>
      </v-col>
      <v-col cols=12>
        <v-calendar
          class="inherit-background-color"
          type="custom-daily"
          :events="events"
          :start="calendarStartDate"
          :end="calendarEndDate"
          :interval-width="$vuetify.breakpoint.mobile ? 25 : 50"
          :interval-format="formatInterval"
          first-time="07:00"
          interval-count="13"
          interval-height="50"
          event-overlap-mode="column"
          locale="de"
          locale-first-day-of-year=4
          @click:event="showEvent"
        >
          <template #day-label-header="{day, present}">
            <span
              :class="['text-h5', present ? 'font-weight-bold':'']"
            >
              {{ day }}
            </span>
          </template>
          <template #event="{event, eventParsed}">
            <div :class="['pa-md-1','custom-event', {'mini-padding': $vuetify.breakpoint.mobile}]">
              <div class="font-weight-bold">
                {{ event.name }}
              </div>
              <div
                class="pt-1"
                v-if="!$vuetify.breakpoint.mobile"
              >
                {{ eventParsed.start.time + ' - ' + eventParsed.end.time + ' Uhr' }}
              </div>
            </div>
          </template>
        </v-calendar>
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
          :max-width="$vuetify.breakpoint.mobile ? undefined : '35%'"
        >
          <lazy-calendar-event-popover
            v-bind="{selectedEvent, selectedOpen}"
            @close="selectedOpen = false"
          />
        </v-menu>
      </v-col>
      <v-col>
        <span class="pt-1 d-flex justify-end text-caption text--secondary">
          Quelle: stundenplan.ostfalia.de
        </span>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapMutations, mapState, mapGetters, mapActions } from 'vuex';
import { mdiChevronLeft, mdiChevronRight, mdiCalendarToday } from '@mdi/js'

export default {
  name: 'SpluseinsCalendar',
  data () {
    return {
      mdiChevronLeft,
      mdiChevronRight,
      mdiCalendarToday,
      selectedEvent: {},
      selectedElement: null,
      selectedOpen: false,
      calendarStartDate: this.$store.getters['splus/weekOrDefault']
    }
  },
  computed: {
    ...mapState({
      schedule: (state) => state.splus.schedule
    }),
    ...mapGetters({
      events: 'splus/getCalendarEvents',
      weekOrDefault: 'splus/weekOrDefault',
      hasEventsOnWeekend: 'splus/getHasEventsOnWeekend'
    }),
    calendarEndDate () {
      return this.$dayjs(this.calendarStartDate).add(this.hasEventsOnWeekend ? 5 : 4, 'days').toDate();
    },
    monthSummary () {
      return this.$dayjs(this.calendarStartDate).format('MMMM YYYY');
    }
  },
  mounted () {
    // force refresh to avoid using outdated cache
    this.refresh();
  },
  methods: {
    ...mapMutations({
      incrementWeek: 'splus/incrementWeek',
      decrementWeek: 'splus/decrementWeek',
      resetWeek: 'splus/resetWeek'
    }),
    ...mapActions({
      load: 'splus/load'
    }),
    setToday () {
      this.resetWeek(true);
      this.refresh();
    },
    prev () {
      this.decrementWeek();
      this.refresh();
    },
    next () {
      this.incrementWeek();
      this.refresh();
    },
    async refresh () {
      // Manually set loading bar, otherwise it isn't displayed properly because of await
      this.$nuxt.$loading.start()
      // Blocking load first and manually set start date afterwards so we avoid load flickering
      await this.load();
      this.calendarStartDate = this.weekOrDefault;
      this.$nuxt.$loading.finish()
    },
    formatInterval (intervalObject) {
      if (this.$vuetify.breakpoint.mobile) {
        return intervalObject.hour.toString().padStart(2, '0')
      } else {
        return intervalObject.time
      }
    },
    showEvent (event) {
      this.selectedEvent = event
      this.selectedElement = event.nativeEvent.target
      setTimeout(() => {
        this.selectedOpen = true
      }, 10)

      event.nativeEvent.stopPropagation()
    }
  }
};
</script>

<style lang="scss">
.v-calendar .v-calendar-daily_head-day-label {
  cursor: auto;
}
.v-calendar .v-calendar-daily__scroll-area {
  overflow-y: hidden;
}
.v-calendar.v-calendar-daily {
  border-left: none !important;
  border-top: none !important;
}
.v-calendar .v-event-timed-container {
  margin-right: -1px;
}

.inherit-background-color {
  background: inherit !important;
}
.custom-event {
  white-space: normal;
  word-wrap: break-word;
  line-height: normal;
}
.mini-padding {
  padding-top: 2px;
  padding-left: 2px;
  padding-right: 1px;
}

</style>
