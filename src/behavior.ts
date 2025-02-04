import { createApp, Reactive } from "vue"
import { KeyEvent, KeyObserver } from "./keyObserver"
import App from "./App.vue"
import { Constants } from "./constants"
import { Empty, SwiftEnum, SwiftEnumCases } from "./enum"
import { Messenger } from "./messenger"
import { shallowReactive } from "vue"

export const Status = {
  idle: "idle",
  aiming: "aiming",
  switching: "switching",
  operating: "operating"
} as const

export type Status = (typeof Status)[keyof typeof Status]

type UsecaseContext = {
  closePanel: Empty
  lookThrough: { direction: "up" | "down" }
}

export const Usecases = new SwiftEnum<UsecaseContext>()
export type Usecases = SwiftEnumCases<UsecaseContext>

export type Actions = {
  dispatch: (usecase: Usecases) => Promise<any>
}

export type PanelState = {
  visible: boolean
  x: number
  y: number
  elem: HTMLElement | null
  backgroundColor: string | null
  canvas: HTMLCanvasElement | null
}

type Pointing = {
  x: number
  y: number
  z: number
  elem: HTMLElement
  cloneElem: HTMLElement
}

function getBackgroundColor(elem: HTMLElement | null, isFollowingParent = true): string | null {
  while (elem) {
    const bgColor = getComputedStyle(elem).backgroundColor
    if (bgColor !== "" && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
      return bgColor
    }
    elem = isFollowingParent ? elem.parentElement : null
  }
  return null
}

export class Behavior {
  private state: Status = Status.idle
  private pointing: Pointing | null = null
  private appContainer: HTMLElement | null = null

  private panelState = shallowReactive<PanelState>({
    visible: false,
    x: 0,
    y: 0,
    elem: null,
    backgroundColor: null,
    canvas: null
  })

  private dependencies: {
    keyObserver: KeyObserver
    messsenger: Messenger
  }

  private behaviorBySystem: { [key in Status]: (...args: any) => void } = {
    [Status.aiming]: () => {
      this.state = Status.aiming
      if (this.appContainer) {
        return
      }

      const appContainer = document.createElement("div")
      document.body.appendChild(appContainer)
      this.appContainer = appContainer

      const app = createApp(App)
      app.provide<Reactive<PanelState>>(Constants.PANEL_STATE, this.panelState)
      app.provide<Actions>(Constants.ACTIONS, {
        dispatch: this.dispatch.bind(this)
      })
      app.mount(appContainer)
    },
    [Status.switching]: () => {
      // do nothing
    },
    [Status.operating]: (pointing: Pointing, x: number, y: number) => {
      if (pointing.elem === null) {
        this.state = Status.idle
        return
      }
      this.state = Status.operating
      this.panelState.elem = pointing.cloneElem
      const backgroundColor = getBackgroundColor(pointing.cloneElem, false)
        ? null
        : getBackgroundColor(pointing.elem.parentElement as HTMLElement)

      this.panelState.x = x + window.scrollX
      this.panelState.y = y + window.scrollY
      // html2canvas(pointing.elem).then((canvas) => {
      // this.panelState.canvas = canvas
      this.panelState.backgroundColor = backgroundColor
      this.panelState.visible = true
      // })
    },
    [Status.idle]: () => {
      this.state = Status.idle
      if (this.pointing === null) {
        return
      }

      this.pointing.elem.style.outline = ""
      this.pointing.elem.style.backgroundColor = ""
      this.pointing = null
    }
  }

  private behaviorByUser: {
    [key in keyof UsecaseContext]: (args: any) => Promise<any>
  } = {
    [Usecases.keys.closePanel]: (): Promise<void> => {
      console.log("closePanel")
      this.panelState.visible = false
      this.behaviorBySystem[Status.idle]()

      // new ApiClient().post()

      return Promise.resolve()
    },
    [Usecases.keys.lookThrough]: ({ direction }: { direction: "up" | "down" }): Promise<void> => {
      console.log("lookThrough", direction)

      if (this.pointing === null) {
        return Promise.resolve()
      }

      this.state = Status.switching

      const elements = document.elementsFromPoint(this.pointing.x, this.pointing.y) as HTMLElement[]

      if (elements.length < 2) {
        return Promise.resolve()
      }

      let nextZ = 0
      if (direction === "up") {
        nextZ = this.pointing.z - 1
        if (nextZ < 0) {
          nextZ = elements.length - 1
        }
      } else {
        nextZ = this.pointing.z + 1
        if (nextZ > elements.length - 1) {
          nextZ = 0
        }
      }

      this.pointing.z = nextZ
      this.pointing.elem.style.outline = this.pointing.elem.dataset.outline ?? ""
      this.pointing.elem.style.backgroundColor = this.pointing.elem.dataset.backgroundColor ?? ""
      const nextElem = elements[nextZ]
      const cloneElem = nextElem.cloneNode(true) as HTMLElement
      if (nextElem.style.outline) {
        nextElem.dataset.outline = nextElem.style.outline
      }
      nextElem.style.outline = "2px solid rgba(0, 153, 255, 0.75)"
      if (nextElem.style.backgroundColor) {
        nextElem.dataset.backgroundColor = nextElem.style.backgroundColor
      }
      nextElem.style.backgroundColor = "rgba(0, 153, 255, 0.1)"
      this.pointing.elem = nextElem
      this.pointing.cloneElem = cloneElem

      return Promise.resolve()
    }
  }

  constructor() {
    this.dependencies = {
      keyObserver: new KeyObserver(),
      messsenger: new Messenger()
    }
  }

  setup() {
    console.log("setup")
    document.addEventListener("mousemove", (event: MouseEvent) => {
      if (this.state === Status.idle || this.state === Status.operating) {
        return
      }

      const topElem = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement

      if (this.pointing && topElem === this.pointing.elem) return

      if (this.pointing) {
        this.pointing.elem.style.outline = this.pointing.elem.dataset.outline ?? ""
        this.pointing.elem.style.backgroundColor = topElem.dataset.backgroundColor ?? ""
        this.pointing = null
      }

      if (topElem) {
        const elem = topElem.cloneNode(true) as HTMLElement
        if (topElem.style.outline) {
          topElem.dataset.outline = topElem.style.outline
        }
        if (topElem.style.backgroundColor) {
          topElem.dataset.backgroundColor = topElem.style.backgroundColor
        }
        topElem.style.outline = "2px solid rgba(0, 153, 255, 0.75)"
        topElem.style.backgroundColor = "rgba(0, 153, 255, 0.1)"
        this.pointing = {
          x: event.clientX,
          y: event.clientY,
          z: 0,
          elem: topElem,
          cloneElem: elem
        }
      }
    })

    document.addEventListener("click", (event: MouseEvent) => {
      if (this.state !== Status.aiming) {
        return
      }
      event.stopPropagation()
      event.preventDefault()
      this.behaviorBySystem[Status.operating](this.pointing, event.clientX, event.clientY)
    })

    this.dependencies.keyObserver.subscribe((context) => {
      console.log("observer:", context.case)

      switch (context.case) {
        case KeyEvent.keys.keyDown: {
          this.behaviorBySystem[Status.aiming]()
          return
        }
        case KeyEvent.keys.keyUp: {
          if (this.pointing !== null && this.state === Status.switching) {
            this.behaviorBySystem[Status.operating](this.pointing, this.pointing.x, this.pointing.y)
          } else if (this.state !== Status.operating) {
            this.behaviorBySystem[Status.idle]()
          }

          return
        }
        case KeyEvent.keys.blur: {
          this.behaviorBySystem[Status.idle]()
          return
        }
        case KeyEvent.keys.arrowUp: {
          if (this.pointing === null || this.state === Status.operating) {
            return
          }
          context.event.preventDefault()
          this.dispatch(Usecases.lookThrough({ direction: "up" }))
          return
        }
        case KeyEvent.keys.arrowDown: {
          if (this.pointing === null || this.state === Status.operating) {
            return
          }
          context.event.preventDefault()
          this.dispatch(Usecases.lookThrough({ direction: "down" }))
          return
        }
      }
    })

    this.dependencies.keyObserver.start()
  }

  dispatch(usecase: Usecases): Promise<any> {
    const { case: _case, ...context } = usecase
    console.log("dispatch", this.behaviorByUser, _case, context)
    return this.behaviorByUser[_case](context)
  }
}
