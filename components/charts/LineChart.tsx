import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  series: LineSeries[];
  /** X axis labels; only first and last are rendered. */
  labels: string[];
  height?: number;
}

const W = 320;

/** Lightweight multi-series line chart (no chart library needed). */
export default function LineChart({ series, labels, height = 140 }: LineChartProps) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const count = Math.max(2, series[0]?.values.length ?? 2);
  const stepX = W / (count - 1);
  const pad = 8;
  const usableH = height - pad * 2;

  const toY = (v: number) => pad + usableH - (v / max) * usableH;
  const toPoints = (values: number[]) =>
    values.map((v, i) => `${i * stepX},${toY(v)}`).join(' ');

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1={0}
            x2={W}
            y1={pad + usableH * f}
            y2={pad + usableH * f}
            stroke="#9CA3AF"
            strokeOpacity={0.2}
            strokeWidth={1}
          />
        ))}
        {series.map((s) => (
          <Polyline
            key={s.name}
            points={toPoints(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) =>
          s.values.map((v, i) => (
            <Circle key={`${s.name}-${i}`} cx={i * stepX} cy={toY(v)} r={3} fill={s.color} />
          ))
        )}
      </Svg>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-xs text-gray-500 dark:text-gray-400">{labels[0]}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">{labels[labels.length - 1]}</Text>
      </View>
      <View className="mt-2 flex-row">
        {series.map((s) => (
          <View key={s.name} className="mr-4 flex-row items-center">
            <View className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {s.name} (max {Math.max(...s.values)})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
