import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

// 保存 APP 中資料狀態的地方，一個 APP 只會有一個 Store
// 被 Store 所管理的單一狀態值
const state = {
  counter: 0,
};
// 負責真正改變 State 的資料，屬於同步更新
const mutations = {
  increment(state) {
    state.counter++;
  },
};
// 保存 APP 中資料狀態的地方，一個 APP 只會有一個 Store
const store = createStore({
  state,
  mutations,
});
export default store;
