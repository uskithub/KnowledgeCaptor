<script setup lang="ts">
import { inject, Reactive, watch } from "vue"
import { Constants } from "./constants"
import { Usecases } from "./behavior"

const panelState = inject<
  Reactive<{
    visible: boolean
    x: number
    y: number
  }>
>(Constants.PANEL_STATE)!

const actions = inject<{
  dispatch: (usecase: Usecases) => Promise<any>
}>(Constants.ACTIONS)!

const onClickClose = () => {
  actions.dispatch(Usecases.closePanel())
}
</script>
<template>
  <div
    v-if="panelState.visible"
    class="vue-panel"
    :style="{ left: panelState.x + 'px', top: panelState.y + 'px' }"
  >
    カスタムパネル
    <button @click="onClickClose" style="margin-left: 10px">閉じる</button>
  </div>
</template>
<style>
.vue-panel {
  position: absolute;
  background: rgba(0, 153, 255, 0.9);
  color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}
</style>
