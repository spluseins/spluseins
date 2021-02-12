<template>
  <v-card>
    <v-card-title>
      <div class="headline">
        Neues vom Campus
      </div>
    </v-card-title>
    <v-card-text>
      <v-list dense>
        <div
          v-for="item in campusNews"
          :key="item.link"
          class="list-tile"
        >
          <a
            :href="item.link"
            target="_blank"
            class="link"
          >
            {{ item.title }}
          </a>
          <br>
          <span :class="['grey--text', {'text--darken-1': !isDark, 'text--lighten-1': isDark }]">
            {{ shortname(item.source) }}.
          </span>
          <span>{{ item.text }}</span>
          <br>
        </div>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'CampusNewsCard',
  data () {
    const availableSoures = [
      { description: 'Campus 38', shortname: 'Campus 38', path: 'campus38' },
      { description: 'Ostfalia Campus', shortname: 'Ostfalia', path: 'campus' },
      { description: 'Standort Wolfenbüttel', shortname: 'Wolfenbüttel', path: 'wf' },
      { description: 'Standort Suderburg', shortname: 'Suderburg', path: 'sud' },
      { description: 'Standort Salzgitter', shortname: 'Salzgitter', path: 'sz' },
      { description: 'Standort Wolfenbüttel', shortname: 'Wolfenbüttel', path: 'wob' }
    ];
    return {
      availableSoures
    }
  },
  computed: {
    ...mapState({
      campusNews: (state) => state.news.campusNews,
      lazyLoad: (state) => state.lazyLoad,
      isDark: state => state.ui.isDark
    })
  },
  mounted () {
    if (this.lazyLoad) {
      // static build -> no news are in the store
      this.loadCampusNews();
    }
  },
  methods: {
    shortname (path) {
      return this.availableSoures.filter(source => source.path === path)[0].shortname;
    },
    ...mapActions({
      loadCampusNews: 'news/loadCampusNews'
    })
  }
};
</script>

<style lang="scss">

.link{
  text-decoration: none;
}

.list-tile{
  padding: 5px 0 5px 0px;
}

</style>
