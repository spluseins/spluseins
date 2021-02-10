<template>
  <v-card>
    <v-card-title class="title-padding">
      <div class="headline">
        Neues {{ selectedItem.title }}
      </div>
      <v-btn
        icon
        @click="dialogOpen = true; $track('News', 'openSelectNews')"
      >
        <v-icon>mdi-newspaper</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text class="card-text-padding">
      <v-list dense>
        <div
          v-for="item in facultyNews"
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
          <span>{{ item.text }}</span>
          <br>
        </div>
      </v-list>
    </v-card-text>

    <select-dialog
      :open.sync="dialogOpen"
      :items="availableSources"
      :selected.sync="selectedItem"
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
    const availableSources = [
      { description: 'Fakultät Elektrotechnik', title: 'aus der E-Technik', path: 'e' },
      { description: 'Fakultät Recht', title: 'aus dem Recht', path: 'r' },
      { description: 'Fakultät Versorgungstechnik', title: 'aus ', path: 'v' },
      { description: 'Fakultät Maschinenbau', title: 'aus ', path: 'm' },
      { description: 'Fakultät Bau-Wasser-Boden', title: 'aus ', path: 'b' },
      { description: 'Fakultät Verkehr-Sport-Tourismus-Medien', title: 'aus ', path: 'k' },
      { description: 'Fakultät Handel und Soziale Arbeit', title: 'aus ', path: 'h' },
      { description: 'Fakultät Fahrzeugtechnik', title: 'aus ', path: 'f' },
      { description: 'Fakultät Gesundsheitswesen', title: 'aus ', path: 'g' },
      { description: 'Fakultät Wirtschaft', title: 'aus ', path: 'w' },
      { description: 'Fakultät Soziale Arbeit', title: 'aus ', path: 's' }
    ];
    return {
      dialogOpen: false,
      availableSources
    }
  },
  computed: {
    selectedItem: {
      get () {
        let selectedItem = this.availableSources.filter(source => source.path === this.faculty)[0];
        if (selectedItem == null) {
          // Reset to default if invalid item is used for some reason. This way we avoid blocking the whole dashboard in edge cases.
          selectedItem = this.availableSources[0];
          this.setFaculty(selectedItem.path);
        }
        return selectedItem;
      },
      set (value) { this.setFaculty(value.path); }
    },
    ...mapState({
      facultyNews: (state) => state.news.facultyNews,
      faculty: (state) => state.news.faculty,
      lazyLoad: (state) => state.lazyLoad
    })
  },
  mounted () {
    if (this.lazyLoad) {
      // static build -> no news are in the store
      this.loadNews();
    }
  },
  methods: {
    ...mapActions({
      loadNews: 'news/loadFacultyNews',
      setFaculty: 'news/setFaculty'
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
