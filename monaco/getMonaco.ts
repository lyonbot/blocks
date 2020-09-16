import registerProtobufLanguage from './monacoProtobuf';
import type { Environment } from 'monaco-editor';
export type Monaco = typeof import('monaco-editor')

declare global {
  interface Window {
    MonacoEnvironment?: Environment | undefined;
  }
}

const baseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min';
let promise: Promise<Monaco> | null = null;

/**
 * 从CDN载入 Monaco 编辑器这个库
 */
export const getMonaco = () => {
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');

      script.type = 'text/javascript';
      script.src = `${baseUrl}/vs/loader.js`;
      script.onload = function () {
        try {
          const _Require = window.require as any;
          _Require.config({ paths: { vs: `${baseUrl}/vs` } });

          const workerBlob = new Blob([
            'self.MonacoEnvironment = { baseUrl:', JSON.stringify(`${baseUrl}/`), '};',
            'importScripts(', JSON.stringify(`${baseUrl}/vs/base/worker/workerMain.js`), ');',
          ], { type: 'text/javascript' });
          const workerURL = URL.createObjectURL(workerBlob);

          window.MonacoEnvironment = {
            getWorkerUrl(workerId, label) {
              return workerURL;
            },
          };

          _Require(['vs/editor/editor.main'], (monaco: Monaco) => {
            registerProtobufLanguage(monaco);
            resolve(monaco);
          });
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = reject;

      document.body.appendChild(script);
    });
  }
  return promise;
};
