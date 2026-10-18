type TelemetryHandler = (data: any) => void;
type ConnectionStatusHandler = (connected: boolean) => void;

class TelemetryWebSocketClient {
  private socket: WebSocket | null = null;
  private url: string = 'ws://127.0.0.1:8000/ws/telemetry';
  private reconnectIntervalMs: number = 3000;
  private isExplicitlyClosed: boolean = false;
  private handlers: Set<TelemetryHandler> = new Set();
  private statusHandlers: Set<ConnectionStatusHandler> = new Set();
  private pingTimer: any = null;

  connect() {
    this.isExplicitlyClosed = false;
    this._initSocket();
  }

  private _initSocket() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this._notifyStatus(true);
        this._startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'TELEMETRY_UPDATE') {
            this.handlers.forEach(handler => handler(parsed));
          }
        } catch {
          // ignore parsing error
        }
      };

      this.socket.onclose = () => {
        this._notifyStatus(false);
        this._stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          setTimeout(() => this._initSocket(), this.reconnectIntervalMs);
        }
      };

      this.socket.onerror = () => {
        this._notifyStatus(false);
      };
    } catch {
      this._notifyStatus(false);
      if (!this.isExplicitlyClosed) {
        setTimeout(() => this._initSocket(), this.reconnectIntervalMs);
      }
    }
  }

  private _startHeartbeat() {
    this._stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    }, 15000);
  }

  private _stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private _notifyStatus(connected: boolean) {
    this.statusHandlers.forEach(handler => handler(connected));
  }

  subscribe(handler: TelemetryHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  subscribeStatus(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.add(handler);
    if (this.socket) {
      handler(this.socket.readyState === WebSocket.OPEN);
    }
    return () => this.statusHandlers.delete(handler);
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this._stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._notifyStatus(false);
  }
}

export const wsClient = new TelemetryWebSocketClient();
