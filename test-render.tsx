import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';

console.log(renderToString(<App />));
