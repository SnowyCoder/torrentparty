import EE, { EventEmitter, EventListener, EventNames, ValidEventTypes } from "eventemitter3";
import { onUnmounted } from "vue";
import init, {ChannelOpenEvent, Topic, WebDht} from "web-dht";
import { Packet } from "./Protocol";
import { NamePlugin } from './NamePlugin';
import { ReconnectPlugin } from './ReconnectPlugin';
import { RoomPlugin } from './RoomPlugin';

type Filter<T, U> = T extends U ? T : never;

function packetKey<
    K extends Packet['type'],
>(key: K): `p/${K}` {
    return 'p/' + key as any;
}

type SocketEventTypes = {
    'connect': [string],
    'connection_open': [string],
    'disconnect': [string],
} & {
    [Type in Packet['type'] as `p/${Type}`]: [Filter<Packet, {"type": Type}>, string]
};

interface PeerData {
    channel: RTCDataChannel,
    connection: RTCPeerConnection,
}

interface DefaultPlugins {
    'name': NamePlugin,
    'reconnect': ReconnectPlugin,
    'room': RoomPlugin,
}

export class Socket<P extends DefaultPlugins = DefaultPlugins> {
    dht: WebDht;
    events = new EventEmitter<SocketEventTypes>();
    peers = new Map<string, PeerData>();
    plugins: P = {} as any;

    private constructor(dht: WebDht) {
        this.dht = dht;
        this.dht.on_connection(this.onChannel.bind(this));
        this.registerDefaultPlugins();
    }

    private registerDefaultPlugins() {
        this.plugins.name = new NamePlugin(this);
        this.plugins.reconnect = new ReconnectPlugin(this);
        this.plugins.room = new RoomPlugin(this);
    }

    get isOnline(): boolean {
        return this.dht.connection_count > 0;
    }

    sendPacket(packet: Packet, onlyTo?: string, notTo?: string) {
        let serialized = JSON.stringify(packet);
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

    async connectTo(peerId: string) {
        if (this.peers.has(peerId)) return;
        const conn = await this.dht.connect_to(peerId);
        const chan = conn.createDataChannel('torrent-party');
        this.initChannel(peerId, conn, chan);
    }

    private initChannel(peerId: string, connection: RTCPeerConnection, channel: RTCDataChannel) {
        channel.binaryType = 'arraybuffer';
        channel.onmessage = (m) => this.onMessage(peerId, m.data);
        channel.onclose = () => this.onClose(peerId);

        const data = {
            channel,
            connection,
        }
        this.peers.set(peerId, data);

        channel.addEventListener('open', () => {
            this.events.emit('connection_open', peerId);
        });

        this.events.emit('connect', peerId);
    }

    private onChannel(ev: ChannelOpenEvent) {
        console.log("Connection from", ev.peer_id);
        this.initChannel(ev.peer_id, ev.connection, ev.channel);
    }

    private async onMessage(peerId: string, message: string) {
        let packet = JSON.parse(message) as Packet;
        this.events.emit(packetKey(packet.type), packet as any, peerId);
    }

    private onClose(peerId: string) {
        this.peers.delete(peerId);
        this.events.emit('disconnect', peerId);
    }

    static async create(): Promise<Socket> {
        await init();
        const dht = await WebDht.create(["https://wdht.rossilorenzo.dev:3141"]);

        return new Socket(dht);
    }

    static createRandomTopic(): Topic {
        const byteLen = 20;
        const choices = '0123456789abcdef';
        let ret = '';
        for (let i = 0; i < byteLen * 2; i++) {
            ret += choices.charAt(Math.floor(Math.random() * choices.length));
        }
        return {
            type: 'raw_id',
            key: ret,
        };
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
