
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ReactModal from 'react-modal';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactModal.setAppElement('#root'); // For accessibility

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);