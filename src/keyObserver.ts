import { Empty, SwiftEnum, SwiftEnumCases } from "./enum";

type Observer<T> = (data: T) => void;

type KeyEventContext = {
  keyDown: { key: string };
  keyUp: { key: string };
  blur: Empty;
};

export const KeyEvent = new SwiftEnum<KeyEventContext>();
export type KeyEvent = SwiftEnumCases<KeyEventContext>;

export class KeyObserver {
  private observers: Observer<KeyEvent>[] = [];
  constructor(private keyCode: string = "MetaLeft") {}

  start() {
    document.addEventListener("keydown", this.keydownHandler.bind(this));
  }

  subscribe(observer: Observer<KeyEvent>): void {
    this.observers.push(observer);
  }

  private keydownHandler(e: KeyboardEvent): void {
    console.log("keydown:", e.code);

    if (e.code !== this.keyCode) {
      return;
    }

    const keyupHandler = ((keyCode: string) => {
      return (e2: KeyboardEvent) => {
        console.log(`waiting for keyup of ${keyCode}:`, e2.code);
        if (e2.code === keyCode) {
          this.observers.forEach((observer) =>
            observer(KeyEvent.keyUp({ key: keyCode })),
          );
          document.removeEventListener("keyup", keyupHandler);
          window.removeEventListener("blur", blurHandler);
        }
      };
    })(e.code);

    const blurHandler = (_e: FocusEvent) => {
      console.log("blur");
      this.observers.forEach((observer) => observer(KeyEvent.blur()));
      document.removeEventListener("keyup", keyupHandler);
      window.removeEventListener("blur", blurHandler);
    };

    this.observers.forEach((observer) =>
      observer(KeyEvent.keyDown({ key: e.code })),
    );
    document.addEventListener("keyup", keyupHandler);
    window.addEventListener("blur", blurHandler);
  }
}
