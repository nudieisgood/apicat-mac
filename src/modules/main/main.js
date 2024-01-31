import { createApp } from "vue";
import App from "./default.vue";
import router from "@/router";
import store from "@/store";

// import 'ant-design-vue/dist/reset.css';
import Ant from "@/plugins/ant";
import "@/scss/ant-design.scss";
import "@/scss/monacoEditor.scss";
import { notification, message, Modal } from "ant-design-vue";
import * as Icons from "@ant-design/icons-vue";
import vClickOutside from "click-outside-vue3";
import infiniteScroll from "vue3-infinite-scroll-good";
// import mitt from 'mitt'
import om from "@/js/utils/om.js";
import "@/scss/markdown.scss";
import Shimmer from "vue3-shimmer";
// import Antd from 'ant-design-vue';
import logger from "@/js/utils/log.js";
// import VuetifyDraggableTreeview from 'vuetify-draggable-treeview'

//先註解
// import "@/mock";
// import mockAxios from "@/utils/mockRequest.js";.
//先註解

import $bus from "@/js/utils/bus.js";

window.om = om;
// window.logger = logger

const app = createApp(App);

// Vue.use(VuetifyDraggableTreeview)

window.showNotification = (type, message) => {
  notification[type]({
    message: message,
    // description:`Cookies for domain ${domainName} deleted successfully.`
    placement: "bottomRight",
    duration: 2.5,
  });
};

//先註解
// app.config.globalProperties.$mockAxios = mockAxios;
//先註解
console.log('__在渲染進程打印 NODE_ENV',process.env.NODE_ENV)
// app.config.globalProperties.$mitt = mitt()
app.config.globalProperties.$notification = notification;
app.provide("$message", message); // 全局註冊
app.provide("$modal", Modal); // 全局註冊
app.provide("$bus", $bus);
app
  .use(store)
  .use(router)
  .use(Ant)
  .use(vClickOutside)
  .use(infiniteScroll)
  .use(Shimmer)
  .use(logger)
  .mount("#app");

const icons = Icons;
for (const i in icons) {
  // console.log(icons[i])
  app.component(i, icons[i]);
}
