import { createRouter, createWebHashHistory } from "vue-router";
import { getUserInformation, autoLogout } from "@/js/ipc/userIPC";
import Layout from "@/modules/layout";
import Login from "@/modules/login";
import Register from "@/modules/register";
import store from "@/store";
import tabsData from "@/store/tabs";
import workspaceData from "@/store/workspace";
import ResetPassword from "@/components/ResetPassword";
import requestData from "@/store/requestData";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/main", component: Layout },
  { path: "/register", component: Register },
  { path: "/resetPassword", component: ResetPassword },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 若無資料則當前無登入中的使用者，有資料直接導至/main
let isLogin = false;

router.beforeEach(async (to) => {
  const res = await getUserInformation();
  if (!res) {
    // 有可能因為重複登入而被自動登出，須清空任何紀錄資料以及DB
    store.commit("CLEAR_USER_INFO");
    requestData.clear();
    store.commit("SET_LAYOUT_MODE", true);
    store.commit("RESET_APP_STATE");
    autoLogout();
    store.commit("SET_SHOW_LAYOUT_LOADING_MODE", false);
    return;
  }

  if (res.token) {
    store.commit("SET_USER_INFO", res);
    workspaceData.setWorkspaceState();

    isLogin = true;
  }

  if (to.fullPath === "/login") {
    if (isLogin) {
      router.push("/main");
    } else {
      router.push("login");
    }
  }
});
export default router;
