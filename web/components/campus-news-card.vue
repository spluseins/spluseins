<template>
  <v-card>
    <v-card-title class="title-padding">
      <div class="headline">
        Neues vom Campus
      </div>
      <v-btn
        icon
        @click.stop="dialogOpen = true; $track('News', 'openSelectNews')"
      >
        <v-icon>mdi-newspaper</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text class="card-text-padding">
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
    <select-dialog
      :open.sync="dialogOpen"
      :items="availableSources"
      :parent-selection.sync="selectedItems"
      title="Quelle auswählen"
    />
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import SelectDialog from './select-dialog.vue'

export default {
  name: 'CampusNewsCard',
  components: {
    SelectDialog
  },
  data () {
    const availableSources = [
      { description: 'Campus 38', shortname: 'Campus38', path: 'campus38' },
      { description: 'Ostfalia Campus', shortname: 'Ostfalia', path: 'campus' },
      { description: 'Standort Wolfenbüttel', shortname: 'Wolfenbüttel', path: 'wf' },
      { description: 'Standort Suderburg', shortname: 'Suderburg', path: 'sud' },
      { description: 'Standort Salzgitter', shortname: 'Salzgitter', path: 'sz' },
      { description: 'Standort Wolfenbüttel', shortname: 'Wolfenbüttel', path: 'wob' }
    ];
    return {
      dialogOpen: false,
      availableSources
    }
  },
  computed: {
    selectedItems: {
      get () { return this.availableSources.filter(source => this.newsSelectors.includes(source.path)); },
      set (value) { this.setSelectors(value.map(item => item.path)); }
    },
    ...mapState({
      campusNews: (state) => state.news.campusNews,
      newsSelectors: (state) => state.news.newsSelectors,
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
      return this.availableSources.filter(source => source.path === path)[0].shortname;
    },
    ...mapActions({
      loadCampusNews: 'news/loadCampusNews',
      setSelectors: 'news/setCampusSelectors'
    })
  }
};
</script>

<style lang="scss">

.title-padding{
  padding: 10px 16px 5px 16px;
}

.link{
  text-decoration: none;
}

.list-tile{
  padding: 5px 0 5px 0px;
}

.card-text-padding{
  padding-top: 0px;
}

</style>
