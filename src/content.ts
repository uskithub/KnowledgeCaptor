import { KeyObserver } from "./keyObserver";

const keyObserver = new KeyObserver();
keyObserver.subscribe((context) => {
  console.log("observer:", context);
});
keyObserver.start();
