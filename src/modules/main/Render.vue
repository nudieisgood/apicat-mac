<template>
  <div class="ted_test">saaaatrrddadddr</div>
  <div>{{ world }}</div>
</template>
<script>
import { ref, onMounted } from 'vue'
export default {
  setup() {
    const world = ref('world')
  

    onMounted(() => {
      // store.commit('increment')
      // console.log('counter', store.state.counter)
    })
    return {
      world
    }
  }


}
</script>

<style scoped lang="scss">
.ted {
  &_test {
    color: red
  }
}
</style>



<!-- <a-button class="modal__btns--btn" @click="console.log('123')">Don't save</a-button>
<router-view></router-view>
<div class="icon-keyboard"></div> -->