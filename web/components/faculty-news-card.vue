<template>
  <v-card class="fill-height">
    <v-card-title class="pb-1">
      <div class="text-h5 mr-1">
        Neues {{ selectedItem.title }}
      </div>
      <v-btn
        icon
        @click="dialogOpen = true"
      >
        <v-icon>{{ mdiNewspaper }}</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-list dense>
        <div
          v-for="item in facultyNews"
          :key="item.link"
          class="py-1"
        >
          <a
            :href="item.link"
            target="_blank"
            class="link"
            rel="noopener"
          >
            {{ item.title }}
          </a>
          <br>
          <span>{{ item.text }}</span>
          <br>
        </div>
      </v-list>
    </v-card-text>

    <lazy-select-dialog
      :open.sync="dialogOpen"
      :items="availableSources"
      :selected.sync="selectedItem"
      title="Quelle auswählen"
    />
  </v-card>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex';
import { mdiNewspaper } from '@mdi/js'

export default {
  name: 'FacultyNewsCard',
  data () {
    const availableSources = [
      { description: 'Campus Wolfenbüttel', title: 'aus Wolfenbüttel', path: 'wf' },
      { description: 'Campus Wolfsburg', title: 'aus Wolfsburg', path: 'wob' },
      { description: 'Campus Suderburg', title: 'aus Suderburg', path: 'sud' },
      { description: 'Fakultät Elektrotechnik', title: 'aus der E-Technik', path: 'e' },
      { description: 'Fakultät Recht', title: 'aus dem Recht', path: 'r' },
      { description: 'Fakultät Soziale Arbeit', title: 'aus der sozialen Arbeit', path: 's' }];

    return {
      dialogOpen: false,
      availableSources,
      mdiNewspaper
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
      faculty: (state) => state.news.faculty
    })
  },
  watch: {
    faculty: function () {
      this.loadNews();
    }
  },
  mounted () {
    // force load because server side might use wrong selected faculty for loading
    this.loadNews();
  },
  methods: {
    ...mapActions({
      loadNews: 'news/loadFacultyNews'
    }),
    ...mapMutations({
      setFaculty: 'news/setFaculty'
    })
  }
};
</script>

<style lang="scss">

.link{
  text-decoration: none;
}

</style>
