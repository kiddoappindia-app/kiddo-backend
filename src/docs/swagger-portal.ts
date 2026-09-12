import { readFileSync } from 'node:fs';
import type { SwaggerUiOptions } from 'swagger-ui-express';

function loadPortalAsset(fileName: string): string {
  return readFileSync(new URL(`./portal/${fileName}`, import.meta.url), 'utf8');
}

export const swaggerPortalCss = loadPortalAsset('kiddo-portal.css');
export const swaggerPortalJs = loadPortalAsset('kiddo-portal.js');
export const swaggerPortalFavicon = loadPortalAsset('kiddo-favicon.svg');

export const swaggerPortalOptions: SwaggerUiOptions = {
  customSiteTitle: 'KidDo API — Developer Documentation',
  customfavIcon: '/api-docs/kiddo-favicon.svg',
  customCssUrl: '/api-docs/kiddo-portal.css',
  customJs: '/api-docs/kiddo-portal.js',
  customCss: 'html{color-scheme:dark}body{background:#0a1020;color:#e6edf7}',
  swaggerOptions: {
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    validatorUrl: null,
    tryItOutEnabled: false,
  },
};
