export const state = () => ({
  faculties: ['e'], // todo changeme
  campusNews: [],
  facultyNews: []
});

export const mutations = {
  setCampusNews (state, data) {
    state.campusNews = data;
  },
  setFacultyNews (state, data) {
    state.facultyNews = data;
  },
  setFaculties (state, faculties) {
    state.faculties = faculties;
  }
}

export const actions = {
  async loadFacultyNews ({ commit, state }) {
    if (state.faculties.length === 0) {
      return commit('setFacultyNews', []);
    }
    try {
      const news = await this.$axios.$get(`/api/news/${state.faculties.join(',')}`, { params: { limit: 7 } });
      commit('setFacultyNews', news);
    } catch (error) {
      commit('enqueueError', 'News: API-Verbindung fehlgeschlagen (Fakultät-News)', { root: true });
      console.error('error during News API call (Fakultät-News)', error.message);
    }
  },
  async setFaculties ({ commit, dispatch }, faculties) {
    commit('setFaculties', faculties);
    dispatch('loadFacultyNews');
  },
  async loadCampusNews ({ commit }) {
    const newsSelectors = ['wf', 'wob', 'sud', 'sz', 'campus', 'campus38'];
    try {
      const campusNews = await this.$axios.$get(`/api/news/${newsSelectors.join(',')}`, { params: { limit: 10 } });

      commit('setCampusNews', campusNews);
    } catch (error) {
      commit('enqueueError', 'News: API-Verbindung fehlgeschlagen (Ostfalia-News)', { root: true });
      console.error('error during News API call (Ostfalia-News)', error.message);
    }
  }
};
