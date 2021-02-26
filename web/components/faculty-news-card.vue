<template>
  <v-card>
    <v-card-title class="title-padding">
      <div class="headline">
        Neues
      </div>
    </v-card-title>
    <v-card-text class="card-text-padding">
      <v-list dense>
        <div
          v-for="item in news"
          :key="item.link"
          class="list-tile"
        >
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
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { flatten } from '../lib/util';

export default {
  name: 'FacultyNewsCard',
  computed: {
    news () {
      return this.facultyNews;
    },
    currentFaculties () {
      const keys = this.favoriteSchedules.map(schedule => schedule.id)
        .concat(flatten(Object.values(this.customSchedules).map(schedule => schedule.id)))
        .filter(key => (!!key && key.length > 0 && key.charAt(1) === '_'))
      return [...new Set(keys.map(key => key.charAt(0)))]
    },
    ...mapState({
      facultyNews: (state) => state.news.facultyNews,
      lazyLoad: (state) => state.lazyLoad,
      customSchedules: (state) => state.splus.customSchedules,
      favoriteSchedules: (state) => state.splus.favoriteSchedules
    })
  },
  mounted () {
    // static build -> no news are in the store
    this.loadNews(this.currentFaculties);
  },
  methods: {
    ...mapActions({
      loadNews: 'news/loadFacultyNews'
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
