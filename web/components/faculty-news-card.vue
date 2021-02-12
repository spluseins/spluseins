<template>
  <v-card>
    <v-card-title class="title-padding">
      <div class="headline">
        Neues {{ selectedItem.title }}
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
          v-for="item in news"
          :key="item.link"
          class="list-tile"
        >
          <span :class="['grey--text', {'text--darken-1': !isDark, 'text--lighten-1': isDark }]">
            {{ shortname(item.source) }}:
          </span>
          <span><a
            :href="item.link"
            target="_blank"
            class="link"
          >
            {{ item.title }}
          </a></span>
          <br>
          {{ item.text }}
          <br>
        </div>
      </v-list>
    </v-card-text>

    <select-dialog
      :open.sync="dialogOpen"
      :items="availableSoures"
      :parent-selection.sync="selectedItem"
      title="Quelle auswählen"
    />
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import SelectDialog from './select-dialog.vue'

export default {
  name: 'FacultyNewsCard',
  components: {
    SelectDialog
  },
  data () {
    const availableSoures = [
      { description: 'Fakultät Elektrotechnik', shortname: 'E-Technik', path: 'e' },
      { description: 'Fakultät Recht', shortname: 'Recht', path: 'r' },
      { description: 'Fakultät Versorgungstechnik', shortname: 'Versorgung', path: 'v' },
      { description: 'Fakultät Maschinenbau', shortname: 'MB', path: 'm' },
      { description: 'Fakultät Bau-Wasser-Boden', shortname: 'BWB', path: 'b' },
      { description: 'Fakultät Verkehr-Sport-Tourismus-Medien', shortname: 'Salzgitter', path: 'k' },
      { description: 'Fakultät Handel und Soziale Arbeit', shortname: 'Handel', path: 'h' },
      { description: 'Fakultät Fahrzeugtechnik', shortname: 'Fahrzeugtechnik', path: 'f' },
      { description: 'Fakultät Gesundsheitswesen', shortname: 'Gesundheit', path: 'g' },
      { description: 'Fakultät Wirtschaft', shortname: 'Wirtschaft', path: 'w' },
      { description: 'Fakultät Soziale Arbeit', shortname: 'Soziales', path: 's' }
    ];
    return {
      dialogOpen: false,
      availableSources
    }
  },
  computed: {
    news () {
      return this.facultyNews;
    },
    selectedItem: {
      get () { return this.availableSoures.filter(source => this.faculties.includes(source.path)); },
      set (value) { this.setFaculties(value.map(item => item.path)); }
    },
    ...mapState({
      facultyNews: (state) => state.news.facultyNews,
      faculties: (state) => state.news.faculties,
      lazyLoad: (state) => state.lazyLoad
    })
  },
  mounted () {
    if (this.lazyLoad) {
      // static build -> no news are in the store
      this.loadNews(this.faculties);
    }
  },
  methods: {
    shortname (path) {
      return this.availableSoures.filter(source => source.path === path)[0].shortname;
    },
    ...mapActions({
      loadNews: 'news/loadFacultyNews',
      setFaculties: 'news/setFaculties'
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
