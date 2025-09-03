export const CustomTick = ({ x, y, payload }: any) => {
  const lines = payload.value.split(" ");
  return (
    <text x={x} y={y} textAnchor="middle" fill="#666">
      {lines.map((line: string, index: number) => (
        <tspan x={x} dy={14} key={index}>
          {line}
        </tspan>
      ))}
    </text>
  );
};
