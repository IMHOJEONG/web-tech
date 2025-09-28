export const CustomTick = ({ x, y, payload }: any) => {
  const lines = payload.value.split(" ");
  const [yymmdd, hhmmss] = lines;
  return (
    <text x={x} y={y} textAnchor="middle" fill="#666" className="text-xs">
      {/* <tspan x={x} dy={10}>
        {yymmdd}
      </tspan> */}
      <tspan x={x} dy={14}>
        {hhmmss}
      </tspan>
    </text>
  );
};
