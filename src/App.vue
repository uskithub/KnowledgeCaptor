<script setup lang="ts">
import { inject, ref, watch } from "vue"
import { Constants } from "./constants"
import { PanelState, Usecases } from "./behavior"

const panelState = inject<PanelState>(Constants.PANEL_STATE)!

const actions = inject<{
  dispatch: (usecase: Usecases) => Promise<any>
}>(Constants.ACTIONS)!

const elemRef = ref<HTMLDivElement | null>(null)

watch(
  () => panelState.elem,
  (newValue) => {
    if (newValue && elemRef.value) {
      console.log("canvas", newValue)
      elemRef.value.innerHTML = ""
      elemRef.value.appendChild(newValue)
    }
  }
)

const onClickClose = () => {
  actions.dispatch(Usecases.closePanel())
}
</script>
<template>
  <div
    v-show="panelState.visible"
    class="vue-panel"
    :style="{ left: panelState.x + 'px', top: panelState.y + 'px' }"
  >
    <div
      ref="elemRef"
      :style="{ backgroundColor: panelState.backgroundColor ?? 'transparent' }"
    ></div>
    <!-- {{ panelState.elem?.outerHTML }} -->
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
