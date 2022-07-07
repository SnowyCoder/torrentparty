import EE, { EventEmitter, EventListener, EventNames, ValidEventTypes } from "eventemitter3";
import { customRef, onUnmounted, Ref, shallowRef, triggerRef } from "vue";
import init, {ChannelOpenEvent, WebDht} from "web-dht";
import { Packet, WrappedPacket } from "./protocol";

type Filter<T, U> = T extends U ? T : never;

function packetKey<
    K extends Packet['type'],
>(key: K): `p/${K}` {
    return 'p/' + key as any;
}

type SocketEventTypes = {
    'connect': [string],
    'disconnect': [string],
} & {
    [Type in Packet['type'] as `p/${Type}`]: [Filter<WrappedPacket, {"type": Type}>, string]
};

interface PeerData {
    channel: RTCDataChannel,
    connection: RTCPeerConnection,
}

export class Socket {
    dht: WebDht;
    state: undefined | "active" | "passive";
    events = new EventEmitter<SocketEventTypes>();
    peers = new Map<string, PeerData>();
    masterId: string = "";
    peerNames = shallowRef(new Map());

    private _name = "";
    name: Ref<string>;

    private constructor(dht: WebDht) {
        this.dht = dht;
        this.dht.on_connection(this.onChannel.bind(this));
        this.name = customRef((track, trigger) => {
            return {
                get: () => {
                    track();
                    return this._name;
                },
                set: (val: string) => {
                    this._name = val;
                    this.peerNames.value.set(this.dht.id, val);
                    triggerRef(this.peerNames);
                    this.sendPacket({
                        type: 'set-name',
                        name: val,
                    });
                    trigger();
                }
            }
        });
        this.peerNames.value.set(this.dht.id, 'unknown');
    }

    get isOnline(): boolean {
        return this.dht.connection_count > 0;
    }

    initActive() {
        if (this.state !== undefined) throw Error("already initialized");
        this.masterId = this.dht.id;
        this.state = "active";
    }

    async initPassive(activeId: string) {
        if (this.state !== undefined) throw Error("already initialized");
        this.masterId = activeId;
        this.state = "passive";
        let conn = await this.dht.connect_to(activeId);
        let chan = conn.createDataChannel('torrent-party');
        this.initChannel(activeId, conn, chan);
    }

    sendPacket(packet: Packet, onlyTo?: string, notTo?: string) {
        let p = packet as WrappedPacket;
        if (this.state == 'active') {
            p.sender = this.dht.id;
        }

        let serialized = JSON.stringify(p);
        if (onlyTo) {
            const peer = this.peers.get(onlyTo);
            if (!peer) {
                throw Error("Cannot find peer");
            }
            peer.channel.send(serialized);
        } else {
            for (let [id, peer] of this.peers) {
                if (id == notTo) continue;
                peer.channel.send(serialized);
            }
        }
    }

    private initChannel(peerId: string, connection: RTCPeerConnection, channel: RTCDataChannel) {
        channel.binaryType = 'arraybuffer';
        channel.onmessage = (m) => this.onMessage(peerId, m.data);
        channel.onclose = () => this.onClose(peerId);
        connection.onnegotiationneeded = async () => {
            const description = await connection.createOffer();
            console.log("NEW", description);
            console.log("OLD", connection.localDescription)
            await connection.setLocalDescription(description);
            this.sendPacket({
                type: 'offer',
                sdp: connection.localDescription!,
            }, peerId);
        };
        connection.onicecandidate = async (e) => {
            if (e.candidate) {
                this.sendPacket({
                    type: 'candidate',
                    sdp: e.candidate,
                }, peerId);
            }

        };
        const data = {
            channel,
            connection,
        }
        this.peers.set(peerId, data);

        // TODO
        channel.addEventListener('open', () => {
            this.name.value = beautifulRandomName();
        });

        this.events.emit('connect', peerId);

        this.peerNames.value.set(peerId, "unknown");
        triggerRef(this.peerNames);
    }

    private onChannel(ev: ChannelOpenEvent) {
        console.log("Connection from", ev.peer_id);
        if (this.state != 'active') {
            return;
        }
        this.initChannel(ev.peer_id, ev.connection, ev.channel);
        this.sendPacket({
            type: 'connect',
            peerId: ev.peer_id,
        }, undefined, ev.peer_id);
        let peers = {} as {[key: string]: string};
        for (let [id, name] of this.peerNames.value) {
            peers[id] = name;
        }
        this.sendPacket({
            type: 'bootstrap',
            peers: peers,
        }, ev.peer_id);
    }

    private async onMessage(peerId: string, message: string) {
        let packet = JSON.parse(message) as WrappedPacket;
        if (this.state == 'active') {
            packet.sender = peerId;
            if (packet.type in ['connect', 'disconnect', 'bootstrap']) return;
        }
        this.events.emit(packetKey(packet.type), packet as any, peerId);

        if (this.state == 'active') {
            let spacket = JSON.stringify(packet);
            for (const [name, peer] of this.peers) {
                if (name != peerId) {
                    peer.channel.send(spacket);
                }
            }
        }

        if (packet.type == 'bootstrap') {
            for (let peerId in packet.peers) {
                this.peerNames.value.set(peerId, packet.peers[peerId]);
            }
            triggerRef(this.peerNames);
        } else if (packet.type == 'set-name') {
            this.peerNames.value.set(packet.sender, packet.name);
            triggerRef(this.peerNames);
        } else if (packet.type == 'connect') {
            this.peerNames.value.set(packet.peerId, 'unknown');
            triggerRef(this.peerNames);
        } else if (packet.type == 'disconnect') {
            this.peerNames.value.delete(packet.peerId);
            triggerRef(this.peerNames);
        } else if (packet.type == 'offer') {
            const conn = this.peers.get(peerId)!.connection;
            if (packet.sdp.type == 'offer') {
                await conn.setRemoteDescription(packet.sdp);
                const ans = await conn.createAnswer();
                await conn.setLocalDescription(ans);
                this.sendPacket({
                    type: 'offer',
                    sdp: conn.localDescription!,
                });
            } else {
                await conn.setRemoteDescription(packet.sdp);
            }
        } else if (packet.type == 'candidate') {
            await this.peers.get(peerId)!.connection.addIceCandidate(packet.sdp);
        }
    }

    private onClose(peerId: string) {
        this.peers.delete(peerId);
        this.peerNames.value.delete(peerId);
        triggerRef(this.peerNames);
    }


    static async create(): Promise<Socket> {
        await init();
        const dht = await WebDht.create(["https://wdht.rossilorenzo.dev:3141"]);

        return new Socket(dht);
    }
}

export function onEvent<
    F extends EventListener<T, E>,
    E extends EventNames<T>,
    T extends ValidEventTypes = string | symbol,
    C = any,
>(e: EE<T, C>, eventName: E, cb: F, context?: any) {
    e.on(eventName, cb, context);

    onUnmounted(() => e.off(eventName, cb, context));
}

function beautifulRandomName(): string {
    const adjectives = [
        'happy', 'angry', 'hungry', 'blushing', 'brave', 'cute', 'evil', 'foolish',
        'naughty', 'lucky', 'scary', 'super', 'zealous', 'tired', 'upset'
    ];
    let center = ' ';
    if (Math.random() < 0.0001) center += 'smol ';
    const names = [
        'bard', 'dinosaur', 'wizard', 'warrior', 'artificier', 'barbarian', 'cleric',
        'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock'
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const name = names[Math.floor(Math.random() * names.length)]
    return adj + center + name;
}
