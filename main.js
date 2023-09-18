function formatFloat(f) {
  return Math.floor(f * 100) / 100;
}

const iterations = 1e3;
document.getElementById("samplesize").textContent = iterations;
const output = document.querySelector("table");

function randomString(bytes) {
  let arr = new Array(bytes).fill(0);
  arr = arr.map((_) => Math.floor(Math.random() * 256));
  return btoa(arr);
}

const idLen = 16;
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

function notificationCopy(obj) {
  return new Notification("", { data: obj, silent: true }).data;
}

function cloneFunc(func) {
  const paramsReg = /(?<=\().+(?=\)[\s+]?\{)/m;
  const bodyReg = /(?<={)(.|[\n|\n\r]?)+(?=})/m;
  const func_string = func.toString();
  if (func.prototype) {
    const body = bodyReg.exec(func_string);
    const params = paramsReg.exec(func_string);
    if (body) {
      if (params) {
        params = params[0].split(",");
        return new Function(...params, body[0]);
      } else {
        return Function(body[0]);
      }
    } else {
      return null;
    }
  } else {
    return eval(func_string);
  }
}
function init(obj) {
  if (obj instanceof Map) {
    return new obj.constructor();
  }
  if (obj instanceof Set) {
    return new obj.constructor();
  }
  const properties = Object.getOwnPropertyDescriptors(obj);
  return Object.create(Object.getPrototypeOf(obj), properties);
}

function customCopy(obj, map = new WeakMap()) {
  if (obj && typeof obj === "object") {
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    if (typeof obj === "symbol") {
      return Symbol(obj.description);
    }
    if (typeof obj === "function") return cloneFunc(obj);

    let res = init(obj);
    if (obj instanceof Map) {
      obj.forEach((value, key) => {
        res.set(key, customCopy(value, map));
      });
      return res;
    }

    if (obj instanceof Set) {
      obj.forEach((value) => {
        res.add(customCopy(value, map));
      });
      return res;
    }

    if (map.get(obj)) return map.get(obj);
    map.set(obj, res);

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === "object") {
        res[key] = customCopy(value, map);
      } else {
        res[key] = value;
      }
    }
    return res;
  }
  return obj;
}

function originalCopy(obj) {
  return structuredClone(obj);
}

async function measure(arr, f) {
  for (let i = 0; i < arr.length; i++) {
    const start = performance.now();
    try {
      await f(arr[i]);
    } catch (e) {
      arr[i] = -1;
      return;
    }
    arr[i] = performance.now() - start;
  }
}

const objTreeDepth = 4;
const objTreeWidth = 4;

document.querySelector("button").onclick = async (_) => {
  let time, arr;

  for (var depth = 1; depth <= objTreeDepth; depth++) {
    for (var width = 1; width <= objTreeWidth; width++) {
      const size = JSON.stringify(randomObject(depth, width)).length;

      console.log("JSON");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      await measure(arr, (obj) => JSON.parse(JSON.stringify(obj)));
      const jsonTime = arr.sort()[Math.floor(arr.length / 2)];

      console.log("Message Channel");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      await measure(arr, async (obj) => await messageCopy(obj));
      const mcTime = arr.sort()[Math.floor(arr.length / 2)];

      console.log("History API");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      await measure(arr, (obj) => historyCopy(obj));
      const hTime = arr.sort()[Math.floor(arr.length / 2)];

      console.log("Notification API");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      await measure(arr, (obj) => notificationCopy(obj));
      const nTime = arr.sort()[Math.floor(arr.length / 2)];

      console.log("Custom API");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      await measure(arr, (obj) => customCopy(obj));
      const cTime = arr.sort()[Math.floor(arr.length / 2)];

      console.log("Original API");
      arr = new Array(iterations)
        .fill(0)
        .map((_) => randomObject(depth, width));
      await measure(arr, (obj) => originalCopy(obj));
      const oTime = arr.sort()[Math.floor(arr.length / 2)];

      output.innerHTML += `
        <tr>
          <td>${depth}</td>
          <td>${width}</td>
          <td>${size}</td>
          <td>${formatFloat(jsonTime)}</td>
          <td>${formatFloat(mcTime)}</td>
          <td>${formatFloat(hTime)}</td>
          <td>${formatFloat(nTime)}</td>
          <td>${formatFloat(cTime)}</td>
          <td>${formatFloat(oTime)}</td>
        </tr>
      `;
      await nextFrame();
    }
  }
};

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
