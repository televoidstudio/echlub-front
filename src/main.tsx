import React from 'react';
import ReactDOM from 'react-dom/client';
import { Container } from 'inversify';
import { IdentityModule } from './modules/identity';
import App from './App';
import 'reflect-metadata';
import './index.css';
import { UniqueId } from './shared/domain';

// 初始化依賴注入容器
const container = new Container();
container.load(IdentityModule);

// 初始化 UniqueId
UniqueId.initialize();

// 將容器導出供其他模組使用
export { container };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App diContainer={container} />
  </React.StrictMode>
); 