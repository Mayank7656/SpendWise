import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "react";

export default function ChartCanvas({ config, className = "h-72" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}
