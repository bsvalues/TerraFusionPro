import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Svg, Path, Circle, G, Line } from 'react-native-svg';

interface AnimatedSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  showAxes?: boolean;
  showLabels?: boolean;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (index: number, value: number) => string;
  style?: any;
  animated?: boolean;
  animationDuration?: number;
  highlightLast?: boolean;
  trend?: boolean;
  formatValue?: (value: number) => string;
}

const AnimatedSparkline: React.FC<AnimatedSparklineProps> = ({
  data,
  width = 150,
  height = 50,
  color = '#3498db',
  lineWidth = 2,
  showDots = false,
  showArea = false,
  showAxes = false,
  showLabels = false,
  formatYLabel = (value) => value.toString(),
  formatXLabel = (index, value) => index.toString(),
  style = {},
  animated = true,
  animationDuration = 1000,
  highlightLast = true,
  trend = true,
  formatValue = (value) => value.toString(),
}) => {
  // Animation progress
  const animationProgress = useRef(new Animated.Value(0)).current;
  
  // Start animation when component mounts
  useEffect(() => {
    if (animated) {
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      animationProgress.setValue(1);
    }
  }, [data, animated, animationDuration, animationProgress]);
  
  // If no data or only one point, return empty view
  if (!data || data.length === 0) {
    return <View style={[styles.container, { width, height }, style]} />;
  }
  
  if (data.length === 1) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Svg width={width} height={height}>
          <Circle cx={width / 2} cy={height / 2} r={lineWidth * 2} fill={color} />
        </Svg>
      </View>
    );
  }
  
  // Calculate min and max values
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  
  // Calculate drawing area
  const padding = showLabels ? 20 : (showAxes ? 10 : 0);
  const drawingWidth = width - padding * 2;
  const drawingHeight = height - padding * 2;
  
  // Calculate scaling factors
  const xScale = drawingWidth / (data.length - 1);
  const yScale = maxValue > minValue ? drawingHeight / (maxValue - minValue) : drawingHeight;
  
  // Generate line path
  let linePath = '';
  let areaPath = '';
  
  data.forEach((value, index) => {
    const x = padding + index * xScale;
    const y = height - padding - (value - minValue) * yScale;
    
    if (index === 0) {
      linePath += `M ${x},${y} `;
      areaPath += `M ${x},${height - padding} L ${x},${y} `;
    } else {
      linePath += `L ${x},${y} `;
      areaPath += `L ${x},${y} `;
    }
  });
  
  // Complete area path
  areaPath += `L ${padding + (data.length - 1) * xScale},${height - padding} Z`;
  
  // Determine trend (increasing or decreasing)
  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const isTrendUp = lastValue > firstValue;
  const trendColor = isTrendUp ? '#2ecc71' : '#e74c3c';
  const actualColor = trend ? trendColor : color;
  
  // Format last value
  const lastValueFormatted = formatValue(lastValue);
  
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        {/* Draw axes if needed */}
        {showAxes && (
          <G>
            {/* Y axis */}
            <Line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="#ccc"
              strokeWidth={1}
            />
            {/* X axis */}
            <Line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#ccc"
              strokeWidth={1}
            />
          </G>
        )}
        
        {/* Draw area under the line if needed */}
        {showArea && (
          <AnimatedPath
            d={areaPath}
            fill={actualColor}
            fillOpacity={0.1}
            animationProgress={animationProgress}
          />
        )}
        
        {/* Draw line */}
        <AnimatedPath
          d={linePath}
          stroke={actualColor}
          strokeWidth={lineWidth}
          fill="none"
          animationProgress={animationProgress}
        />
        
        {/* Draw dots if needed */}
        {showDots && data.map((value, index) => {
          const x = padding + index * xScale;
          const y = height - padding - (value - minValue) * yScale;
          
          return (
            <AnimatedCircle
              key={index}
              cx={x}
              cy={y}
              r={lineWidth}
              fill={index === data.length - 1 && highlightLast ? actualColor : '#fff'}
              stroke={actualColor}
              strokeWidth={1}
              animationProgress={animationProgress}
              isLast={index === data.length - 1}
            />
          );
        })}
      </Svg>
      
      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <View style={styles.yLabelsContainer}>
            <Text style={styles.label}>{formatYLabel(maxValue)}</Text>
            <Text style={styles.label}>{formatYLabel(minValue)}</Text>
          </View>
          <View style={styles.xLabelsContainer}>
            <Text style={styles.label}>{formatXLabel(0, data[0])}</Text>
            <Text style={styles.label}>
              {formatXLabel(data.length - 1, data[data.length - 1])}
            </Text>
          </View>
        </View>
      )}
      
      {/* Trend indicator and last value */}
      {trend && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendArrow, { color: trendColor }]}>
            {isTrendUp ? '↑' : '↓'}
          </Text>
          <Text style={[styles.trendValue, { color: trendColor }]}>
            {lastValueFormatted}
          </Text>
        </View>
      )}
    </View>
  );
};

// Animated SVG components
const AnimatedPath = ({ d, stroke, strokeWidth, fill, fillOpacity, animationProgress }) => {
  const strokeDasharray = useRef([0, 0]);
  
  if (fill === 'none') { // For line path
    const pathRef = useRef(null);
    
    useEffect(() => {
      if (pathRef.current) {
        try {
          const length = pathRef.current.getTotalLength();
          strokeDasharray.current = [length, length];
        } catch (e) {
          console.error('Error measuring path length:', e);
        }
      }
    }, [d]);
    
    const strokeDashoffset = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [strokeDasharray.current[0] || 0, 0],
    });
    
    return (
      <Path
        ref={pathRef}
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
        strokeDasharray={strokeDasharray.current}
        strokeDashoffset={strokeDashoffset}
      />
    );
  } else { // For area path
    const opacity = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, fillOpacity || 1],
    });
    
    return (
      <Path
        d={d}
        fill={fill}
        fillOpacity={opacity}
      />
    );
  }
};

const AnimatedCircle = ({ cx, cy, r, fill, stroke, strokeWidth, animationProgress, isLast }) => {
  const scale = animationProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0.8, 1],
  });
  
  const radius = isLast ? r * 1.5 : r;
  
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ transform: [{ scale }] }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  labelsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  yLabelsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  xLabelsContainer: {
    position: 'absolute',
    left: 20,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 8,
    color: '#7f8c8d',
  },
  trendContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendArrow: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 2,
  },
  trendValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AnimatedSparkline;