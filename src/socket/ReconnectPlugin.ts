import { Socket } from "./Socket";

export class ReconnectPlugin {
    private readonly socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;

        socket.events.on('connect', peerId => {
            const connection = this.socket.peers.get(peerId)!.connection;
            connection.addEventListener('negotiationneeded', async () => {
                const description = await connection.createOffer();
                await connection.setLocalDescription(description);
                this.socket.sendPacket({
                    type: 'offer',
                    sdp: connection.localDescription!,
                }, peerId);
            });
            connection.addEventListener('icecandidate', e => {
                if (!e.candidate) return;
                this.socket.sendPacket({
                    type: 'candidate',
                    sdp: e.candidate,
                }, peerId);
            })
        });

        socket.events.on('p/offer', async (packet, sender) => {
            const conn = this.socket.peers.get(sender)!.connection;
            if (packet.sdp.type == 'offer') {
                await conn.setRemoteDescription(packet.sdp);
                const ans = await conn.createAnswer();
                await conn.setLocalDescription(ans);
                this.socket.sendPacket({
                    type: 'offer',
                    sdp: conn.localDescription!,
                });
            } else {
                await conn.setRemoteDescription(packet.sdp);
            }
        });

        socket.events.on('p/candidate', async (packet, sender) => {
            await this.socket.peers.get(sender)!.connection.addIceCandidate(packet.sdp);
        });
    }
}
