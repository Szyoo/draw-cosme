import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';

function App() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 监听 draw-log
    const handler = (event: any, msg: string) => {
      setLogs(prev => [...prev, msg]);
    };
    ipcRenderer.on('draw-log', handler);

    return () => {
      ipcRenderer.removeListener('draw-log', handler);
    };
  }, []);

  const handleStartDraw = async () => {
    try {
      // 这里假设 userId=1
      const result = await ipcRenderer.invoke('start-draw', { userId: 1 });
      if (result.success) {
        setLogs(prev => [...prev, 'Draw flow completed successfully.']);
      } else {
        setLogs(prev => [...prev, 'Error: ' + result.error]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, 'Exception: ' + err.message]);
    }
  };

  return (
    <div>
      <h1>draw-cosme: cosme-x</h1>
      <button onClick={handleStartDraw}>Start Draw</button>
      <div style={{ marginTop: '1rem', border: '1px solid #ddd', padding: '0.5rem' }}>
        <h2>Logs</h2>
        {logs.map((log, idx) => <div key={idx}>{log}</div>)}
      </div>
    </div>
  );
}

export default App;
