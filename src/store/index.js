import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import app from '@/store/app'
import config from '@/store/config'
import user from '@/store/user'

export default createStore({
  devtools: false,
  plugins: [createPersistedState({
    // paths: ['app', 'tabsRecord', 'user', 'config'],
    key: 'ApiCat',
    reducer(val) {
      return {
        app: val.app,
        config: val.config,
        user: val.user,
      };
    },
  })],
  modules: {
    app: app,
    config: config,
    user: user
  }
})
