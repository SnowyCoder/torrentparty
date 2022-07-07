
export type WrappedPacket = Packet & {
    sender: string,
};

export type Packet = {
    type: 'set-name',
    name: string,
} |
{
    type: 'magnet-uri',
    uri: string,
} |
{
    type: 'video-interact',
    class: 'play' | 'pause' | 'seek',
    currentTime: number
} | {
    type: 'connect' | 'disconnect',
    peerId: string,
} | {
    type: 'bootstrap',
    peers: {[id: string]: string},
} | {
    type: 'download-status',
    value: number,
} | {
    type: 'start-watching'
} | {
    type: 'start-stream',
} | {
    type: 'offer',
    sdp: RTCSessionDescription,
} | {
    type: 'candidate',
    sdp: RTCIceCandidate,
};
