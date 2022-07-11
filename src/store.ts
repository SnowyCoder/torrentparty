import type { Component, InjectionKey, Ref } from 'vue'
import { Instance } from 'webtorrent';
import { Socket } from './socket/Socket';


export const torrentKey = Symbol() as InjectionKey<Instance>;
export const socketKey = Symbol() as InjectionKey<Socket>;



declare type FriendListExtraComponent = Component<{
    peer: string,
}>;
export const friendListExtraKey = Symbol() as InjectionKey<Ref<FriendListExtraComponent | null>>;
