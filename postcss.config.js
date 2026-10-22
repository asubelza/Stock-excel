import postcssNested from 'postcss-nested';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  plugins: [
    postcssNested(),
    autoprefixer(),
    isProduction && cssnano({
      preset: 'default',
    }),
  ].filter(Boolean),
};