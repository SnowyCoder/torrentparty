
export type Packet =
    TorrentPacket |
    StreamPacket |
{
    type: 'set-name',
    name: string,
} |
{
    type: 'connect' | 'disconnect',
    peerId: string,
} | {
    type: 'offer',
    sdp: RTCSessionDescription,
} | {
    type: 'candidate',
    sdp: RTCIceCandidate,
};

export type TorrentPacket = {
    type: 'magnet-uri',
    uri: string,
} | {
    type: 'stop-torrent',
} | {
    type: 'video-interact',
    class: 'play' | 'pause' | 'seek',
    currentTime: number
} | {
    type: 'download-status',
    value: number,
} | {
    type: 'torrent-query-state'
} | {
    type: 'torrent-state',
    time: number,
    paused: boolean,
};

export type StreamPacket =  | {
    type: 'start-stream',
} | {
    type: 'stop-stream',
};
