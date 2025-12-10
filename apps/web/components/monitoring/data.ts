export const initialNodes = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Server" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "client" } },
];
export const initialEdges = [
  { id: "n1-n2", source: "n1", target: "n2", animated: true },
];
