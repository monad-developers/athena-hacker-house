import WebSocket, { WebSocketServer } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

class LidAngleServer {
  private port: number;
  private wss: WebSocketServer;
  private lidAngleProcess: ChildProcess | null;
  private currentAngle: number | null;
  private isRunning: boolean;
  private lastAngleTime: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.lidAngleProcess = null;
    this.currentAngle = null;
    this.isRunning = false;
    this.lastAngleTime = 0;

    this.setupWebSocketServer();
    this.startLidAngleMonitoring();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔗 New client connected to LidAngle server');

      // Send current angle immediately if available
      if (this.currentAngle !== null) {
        ws.send(JSON.stringify({
          type: 'angle',
          angle: this.currentAngle,
          timestamp: Date.now(),
        }));
      }

      ws.on('close', () => {
        console.log('❌ Client disconnected from LidAngle server');
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log(`🚀 LidAngle WebSocket server running on port ${this.port}`);
  }

  private startLidAngleMonitoring(): void {
    if (this.isRunning) {
      console.log('⚠️ Lid angle monitoring already running');
      return;
    }

    try {
      // Path to the sensor bridge executable
      const sensorBridgePath = path.join(process.cwd(), 'sensor-bridge');

      console.log('🔄 Starting lid angle monitoring...');
      console.log('📁 Sensor bridge path:', sensorBridgePath);

      this.lidAngleProcess = spawn(sensorBridgePath, ['--json'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.isRunning = true;

      this.lidAngleProcess.stdout?.on('data', (data: Buffer) => {
        try {
          const output = data.toString().trim();
          if (!output) return;

          const result = JSON.parse(output);

          if (result && typeof result.angle === 'number') {
            this.currentAngle = Math.round(result.angle * 10) / 10; // Round to 1 decimal
            this.lastAngleTime = Date.now();

            // Broadcast angle to all connected clients
            const message = JSON.stringify({
              type: 'angle',
              angle: this.currentAngle,
              timestamp: this.lastAngleTime,
            });

            this.wss.clients.forEach((client: WebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });

            // console.log(`📐 Lid angle: ${this.currentAngle}°`);
          }
        } catch (error) {
          console.error('❌ Failed to parse sensor data:', error);
        }
      });

      this.lidAngleProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString().trim();
        if (error && !error.includes('Warning')) {
          console.error('❌ Sensor bridge error:', error);
        }
      });

      this.lidAngleProcess.on('close', (code: number | null) => {
        console.log(`🛑 Sensor bridge process exited with code: ${code}`);
        this.isRunning = false;
        this.lidAngleProcess = null;

        // Attempt to restart after 5 seconds
        setTimeout(() => {
          if (!this.isRunning) {
            console.log('🔄 Attempting to restart sensor bridge...');
            this.startLidAngleMonitoring();
          }
        }, 5000);
      });

      this.lidAngleProcess.on('error', (error: Error) => {
        console.error('❌ Failed to start sensor bridge:', error.message);
        this.isRunning = false;
        this.lidAngleProcess = null;
      });

    } catch (error) {
      console.error('❌ Error starting lid angle monitoring:', error);
    }
  }

  public stop(): void {
    console.log('🛑 Stopping LidAngle server...');

    if (this.lidAngleProcess) {
      this.lidAngleProcess.kill();
      this.lidAngleProcess = null;
    }

    this.isRunning = false;
    this.wss.close();
  }

  public getCurrentAngle(): number | null {
    return this.currentAngle;
  }

  public getConnectionCount(): number {
    return this.wss.clients.size;
  }
}

// Start server if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  const server = new LidAngleServer(8080);

  process.on('SIGINT', () => {
    console.log('\n👋 Received SIGINT, gracefully shutting down...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, gracefully shutting down...');
    server.stop();
    process.exit(0);
  });
}

export default LidAngleServer;