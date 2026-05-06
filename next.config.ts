import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    'recharts',
    'victory-vendor',
    'd3-array',
    'd3-shape',
    'd3-scale',
    'd3-color',
    'd3-format',
    'd3-interpolate',
    'd3-path',
    'd3-time',
    'd3-time-format',
    'internmap'
  ],
};

export default nextConfig;
