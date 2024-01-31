import { createRouter, createWebHashHistory } from "vue-router";
// 定义路由组件， 注意，这里一定要使用 文件的全名（包含文件后缀名）
import Home from "@/modules/testPages/Home.vue";
import Plus from "@/modules/testPages/Plus.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/plus",
    name: "Plus",
    component: Plus,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
