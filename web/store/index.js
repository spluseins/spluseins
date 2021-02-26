export const state = () => ({
  /**
   * State schema version.
   * Should be incremented if the store schema changes and local browser data
   * needs to be migrated.
   */
  version: 4,
  /**
   * Set to true by vuex-persist during restoration.
   */
  browserStateReady: false,
  /**
   * If true, do not load lectures on the server.
   * true if frontend is a static build.
   */
  lazyLoad: false,
  errorQueue: []
});

export const mutations = {
  enableLazyLoad (state) {
    state.lazyLoad = true;
  },
  enqueueError (state, message) {
    state.errorQueue.push(message);
  },
  dequeueError (state) {
    state.errorQueue.shift();
  }
};

export const actions = {
  async nuxtServerInit ({ commit, dispatch }) {
    /*
    // TODO disables web -> API communication
    // browser cookies cannot be transfered
    // so authentication would fail
    commit('enableLazyLoad');
    return;
    */

    if (process.static) {
      commit('enableLazyLoad');
      return;
    }

    await Promise.all([
      dispatch('mensa/load'),
      dispatch('bus/load'),
      dispatch('news/loadCampusNews')
    ]);
  }
}
