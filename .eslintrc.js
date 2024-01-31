module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    //只需在package.json做設置
    // parser: '@babel/eslint-parser',
    // ecmaVersion: 6
  },
  extends: [
    "plugin:vue/vue3-essential",
    // 'eslint:recommended',
    // '@vue/eslint-config-prettier/skip-formatting'
    // '@nuxtjs',
    // 'plugin:nuxt/recommended',
    // 'airbnb-base', // airbnb style
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  plugins: [
    // 'vuefix',
    // 'html',
    // 'vue',
  ],
  rules: {
    "vue/multi-word-component-names": 0,
    "no-console": "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-param-reassign": 0,
    "linebreak-style": 0,
    "vue/no-v-html": 0,
    "no-shadow": ["error", { allow: ["state"] }],
    // 'import/no-unresolved': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "import/extensions": 0,
    "import/no-extraneous-dependencies": 0,
    "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
    "no-multiple-empty-lines": 0,
    "max-len": ["error", { code: 900 }],
    "no-underscore-dangle": 0,
    "no-unused-expressions": [
      "error",
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    "func-names": 0,
    "vue/script-setup-uses-vars": "off",
    "no-shadow": "off",
  },
  // settings: {
  //   "import/resolver": {
  //     webpack: {
  //       config: "node_modules/@vue/cli-service/webpack.config.js",
  //     },
  //   },
  // },
};
