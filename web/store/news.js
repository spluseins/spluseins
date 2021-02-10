export const state = () => ({
  faculty: 'e', // todo changeme
  campusNews: [],
  facultyNews: {}
});

export const mutations = {
  setCampusNews (state, data) {
    state.campusNews = data;
  },
  setFacultyNews (state, data) {
    state.facultyNews = data;
  },
  setFaculty (state, faculty) {
    state.faculty = faculty;
  }
}

export const actions = {
  async loadFacultyNews ({ commit }) {
    const faculties = ['r', 'v', 'm', 'b', 'k', 'h', 'f', 'g', 'w', 'e', 's'];
    try {
      const news = await this.$axios.$get(`/api/news/${faculties.join(',')}`);

      const newsMap = {};
      faculties.forEach((faculty) => { newsMap[faculty] = news.filter((article) => article.source == faculty) });

      commit('setFacultyNews', newsMap);
    } catch (error) {
      commit('enqueueError', 'News: API-Verbindung fehlgeschlagen (Fakultät-News)', { root: true });
      console.error('error during News API call (Fakultät-News)', error.message);
    }
  },
  async setFaculty ({ commit, dispatch }, faculty) {
    commit('setFaculty', faculty);
    dispatch('loadFacultyNews');
  },
  async loadCampusNews ({ commit }) {
    const newsSelectors = ['wf', 'wob', 'sud', 'sz', 'campus', 'campus38'];
    try {
      const campusNews = await this.$axios.$get(`/api/news/${newsSelectors.join(',')}`, { params: { limit: 7 } });

      commit('setCampusNews', campusNews);
    } catch (error) {
      commit('enqueueError', 'News: API-Verbindung fehlgeschlagen (Ostfalia-News)', { root: true });
      console.error('error during News API call (Ostfalia-News)', error.message);
    }
  }
};
