/*
 * @Author: cola
 * @Date: 2023-09-18 19:58:18
 * @LastEditors: cola
 * @Description:
 */
function randomString(bytes) {
  let arr = new Array(bytes).fill(0);
  arr = arr.map((_) => Math.floor(Math.random() * 256));
  return btoa(arr);
}

const idLen = 8;
function randomObject(depth, width) {
  const r = {};
  for (let i = 0; i < width; i++) {
    if (depth == 0) {
      r[randomString(idLen)] = i;
    } else {
      r[randomString(idLen)] = randomObject(depth - 1, width);
    }
  }
  return r;
}

function historyCopy(obj) {
  const oldState = history.state;
  history.replaceState(obj, window.title);
  const copy = history.state;
  history.replaceState(oldState, window.title);
  return copy;
}

function messageCopy(obj) {
  return new Promise((resolve) => {
    const { port1, port2 } = new MessageChannel();
    port2.onmessage = (ev) => resolve(ev.data);
    port1.postMessage(obj);
  });
}

let iterations;
async function measure(f) {
  const start = performance.now();
  await f();
  return performance.now() - start;
}

const objTreeDepth = 4;
const objTreeWidth = 4;

self.onmessage = async (ev) => {
  iterations = ev.data;
  // console.log(iterations, ev);
  let time, arr;

  for (var depth = 1; depth <= 4; depth++) {
    for (var width = 1; width <= 4; width++) {
      const size = JSON.stringify(randomObject(depth, width)).length;

      console.log("JSON");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      const jsonTime = await measure(async (_) => {
        arr.map((obj) => (JSON.parse(JSON.stringify(obj)), true));
      });

      console.log("Message Channel");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      const mcTime = await measure(async (_) => {
        arr.map((obj) => (messageCopy(obj), true));
      });

      // console.log('History API');
      // arr = new Array(iterations).fill(0).map(_ => randomObject(depth, width));
      // const hTime = await measure(async _ => {
      //   arr.map(obj => (historyCopy(obj), true));
      // });
      const hTime = -1;

      self.postMessage({ depth, width, size, jsonTime, mcTime, hTime });
    }
  }
};
