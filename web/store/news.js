export const state = () => ({
  newsSelectors: ['campus'],
  facultyNews: [],
  campusNews: []
});

export const mutations = {
  setCampusNews (state, data) {
    state.campusNews = data;
  },
  setFacultyNews (state, data) {
    state.facultyNews = data;
  },
  setCampusSelectors (state, newsSelectors) {
    state.newsSelectors = newsSelectors;
  }
}

export const actions = {
  async loadFacultyNews ({ commit }, faculties) {
    if (faculties.length === 0) {
      return commit('setFacultyNews', []);
    }
    try {
      const news = await this.$axios.$get(`/api/news/${faculties.join(',')}`, { params: { limit: 5 } });
      commit('setFacultyNews', news);
    } catch (error) {
      commit('enqueueError', 'News: API-Verbindung fehlgeschlagen (Fakultät-News)', { root: true });
      console.error('error during News API call (Fakultät-News)', error.message);
    }
  },
  async setCampusSelectors ({ commit, dispatch }, newsSelectors) {
    commit('setCampusSelectors', newsSelectors);
    dispatch('loadCampusNews');
  },
  async loadCampusNews ({ commit, state }) {
    if (state.newsSelectors.length === 0) {
      return commit('setCampusNews', []);
    }
    try {
      const campusNews = await this.$axios.$get(`/api/news/${state.newsSelectors.join(',')}`, { params: { limit: 8 } });
      commit('setCampusNews', campusNews);
    } catch (error) {
      commit('enqueueError', 'News: API-Verbindung fehlgeschlagen (Ostfalia-News)', { root: true });
      console.error('error during News API call (Ostfalia-News)', error.message);
    }
  }
};
