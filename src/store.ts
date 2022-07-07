import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'
import { Instance } from 'webtorrent';
import { Socket } from './socket';


export const torrentKey = Symbol() as InjectionKey<Instance>;
export const socketKey = Symbol() as InjectionKey<ComputedRef<Socket>>;
