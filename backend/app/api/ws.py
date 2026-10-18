from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.simulation.simulator import simulator

router = APIRouter()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    await simulator.register_websocket(websocket)
    try:
        while True:
            # Keep connection alive; client can send ping or commands
            msg = await websocket.receive_text()
            # If client sends ping, respond with pong
            if msg == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        await simulator.unregister_websocket(websocket)
    except Exception:
        await simulator.unregister_websocket(websocket)
