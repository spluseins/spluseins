import * as moment from 'moment';

export const state = () => ({
  /**
   * List of MensaDayPlan objects
   */
  plans: [],
});

export const mutations = {
  setPlans(state, data){
    state.plans = data;
  },
}

export const getters = {
  getNextAvailablePlan: (state) => {
    if(state.plans.length == 0){
      return {};
    }

    // A plan is old if today is not friday, the mensa was open today and it's after 15 o'clock
    const isOld = moment().day() != 5 && moment().isSame(state.plans[0].date, 'day') && moment().hour() > 14

    return isOld ? state.plans[1] : state.plans[0];
  },
}

export const actions = {
  async load({ state, commit }) {
    if(state.plans[0] != undefined && moment().isSame(state.plans[0].date, 'day')) {
        return; // If weekPlan is not empty and data is up-to-date don't fetch
    }
      
    let result = [];

    try {
      const response = await this.$axios.get(`/api/mensa`);
      result = response.data;
    } catch (error) {
        commit('enqueueError', 'Mensa: API-Verbindung fehlgeschlagen', {root:true});
        console.error('error during Mensa API call', error.message);
    }

    commit('setPlans', result);
  }
};