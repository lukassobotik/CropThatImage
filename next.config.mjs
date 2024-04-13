import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf8'));
const { version } = packageJson;
/** @type {import('next').NextConfig} */
const nextConfig = {
    publicRuntimeConfig: {
        version,
    }
};

export default nextConfig;
