<template>
  <router-view></router-view>
</template>

<script>
import requestData from "@/store/requestData";
import tabsData from "@/store/tabs";
import { exportCollection, downloadHtmlFile } from "@/js/ipc/collectionIPC.js";
import { getWorkspaceTree, manualDoActivity } from "@/js/ipc/workspaceIPC.js";
import workspaceData from "@/store/workspace";
import logData from "@/store/logData";
import { onMounted, computed } from "vue";
import { useStore } from "vuex";

export default {
  setup() {
    window.exportJson = async (workspaceId, collectionsId) => {
      const data = {
        workspaceId,
        collectionsId,
      };
      await exportCollection(data);
    };
    window.exportHtml = async (workspaceId, collectionsId) => {
      const data = {
        workspaceId,
        collectionsId,
      };
      await downloadHtmlFile(data);
    };

    window.doActivity = async () => {
      return await manualDoActivity();
    };

    const electron = window.require("electron");
    const { ipcRenderer } = electron;

    ipcRenderer.on("reload", async (event, arg) => {
      await getWorkspaceTree({ workspaceId: Number(arg) });
    });

    ipcRenderer.on("show-message", async (event, arg) => {
      window.showNotification(arg.type, arg.message);
    });

    ipcRenderer.on("update-workspace-list", async (event, arg) => {
      await workspaceData.getAllWorkspaceList();
    });

    // remote.enable(ipcRenderer);
    // ipcRenderer.invoke("log", "info", "这是一条日志信息");
    const store = useStore();

    const userState = computed(() => {
      return store.getters.getUserState;
    });
    onMounted(() => {
      // console.log("userState__", userState.value);
      // ipcRenderer.send("init-websocket", userState.value.id);
    });

    return {
      requestData,
      tabsData,
      logData,
    };
  },
};
</script>
