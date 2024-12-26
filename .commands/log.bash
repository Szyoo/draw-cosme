npm init -y

# Electron
npm install --save electron

# React (前端)
npm install --save react react-dom

# 打包/开发工具 (Vite + TS为例)
npm install --save-dev vite @vitejs/plugin-react typescript

# Type定义
npm install --save-dev @types/react @types/react-dom @types/node

# Playwright (Node 版)
npm install --save playwright

# SQLite + Migrations 
# 这里选 "better-sqlite3" + "db-migrate" (或者其他迁移工具)
npm install --save better-sqlite3
npm install --save-dev db-migrate db-migrate-sqlite3

npm install --save-dev electron-builder

npm install axios @types/axios --save

npm run db:migrate
