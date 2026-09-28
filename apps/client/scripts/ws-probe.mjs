import WebSocket from "ws";

const LAN = process.env.LAN ?? "10.0.2.98";
const origin = `http://${LAN}:5173`;
const direct = `http://${LAN}:2567`;

async function matchmake(base) {
  const res = await fetch(`${base}/matchmake/joinOrCreate/xian`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name: "ws-probe" }),
  });
  return res.json();
}

async function tryWs(label, httpBase, seat) {
  const wsBase = httpBase.replace(/^http/, "ws");
  const url = `${wsBase}/${seat.processId}/${seat.roomId}?sessionId=${seat.sessionId}`;
  console.log(label, url);
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const t = setTimeout(() => {
      ws.terminate();
      resolve("timeout");
    }, 4000);
    ws.on("open", () => {
      clearTimeout(t);
      ws.close();
      resolve("open");
    });
    ws.on("error", (e) => {
      clearTimeout(t);
      resolve(`error: ${e.message}`);
    });
  });
}

const data = await matchmake(origin);
const seat = {
  sessionId: data.sessionId,
  roomId: data.roomId,
  processId: data.processId,
};

console.log(await tryWs("proxy5173", origin, seat));

const data2 = await matchmake(direct);
const seat2 = {
  sessionId: data2.sessionId,
  roomId: data2.roomId,
  processId: data2.processId,
};
console.log(await tryWs("direct2567", direct, seat2));
