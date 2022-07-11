import { customRef, Ref, shallowRef, triggerRef } from "vue";

import { Socket } from "./Socket";

export class NamePlugin {
    private readonly socket: Socket;
    private _name = "";
    name: Ref<string>;
    peerNames = shallowRef(new Map<string, string>());

    constructor(socket: Socket) {
        this.socket = socket;
        this.name = customRef((track, trigger) => {
            return {
                get: () => {
                    track();
                    return this._name;
                },
                set: (val: string) => {
                    this._name = val;
                    this.peerNames.value.set(this.socket.dht.id, val);
                    triggerRef(this.peerNames);
                    this.socket.sendPacket({
                        type: 'set-name',
                        name: val,
                    });
                    trigger();
                }
            }
        });
        this._name = beautifulRandomName();
        this.peerNames.value.set(this.socket.dht.id, this._name);

        socket.events.on('p/set-name', (packet, sender) => {
            this.peerNames.value.set(sender, packet.name);
            triggerRef(this.peerNames);
        });
        socket.events.on('connect', peerId => {
            this.peerNames.value.set(peerId, "unknown");
            triggerRef(this.peerNames);
        });
        socket.events.on('connection_open', peerId => {
            this.socket.sendPacket({
                type: 'set-name',
                name: this._name,
            }, peerId);
        });
        socket.events.on('disconnect', peerId => {
            this.peerNames.value.delete(peerId);
            triggerRef(this.peerNames);
        });
    }
}

function beautifulRandomName(): string {
    const adjectives = [
        'happy', 'angry', 'hungry', 'blushing', 'brave', 'cute', 'evil', 'foolish',
        'naughty', 'lucky', 'scary', 'super', 'zealous', 'tired', 'upset', 'sad', 'gloomy',
        'edgy', 'good', 'loyal', 'friendly', 'melancholy',
    ];
    let center = ' ';
    if (Math.random() < 0.001) center += 'smol ';
    const names = [
        'bard', 'dinosaur', 'wizard', 'warrior', 'artificier', 'barbarian', 'cleric',
        'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock',
        'master', 'familiar',
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const name = names[Math.floor(Math.random() * names.length)]
    return adj + center + name;
}
