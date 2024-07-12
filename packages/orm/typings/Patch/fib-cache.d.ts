/// <reference types="@fibjs/types" />
declare const fibCache: any;
declare module "fib-cache" {
    interface LRUOptions {
        max?: number;
        ttl?: number;
        resolver?: (key: string) => any;
    }
    interface LRUItem {
        expiry: number;
        key: string;
        prev: LRUItem;
        next: LRUItem;
        owner: LRU;
        value: any;
        ready: Class_Event;
    }
    class LRU {
        constructor(options?: LRUOptions);
        items: Record<string, LRUItem>;
        size: number;
        first: LRUItem;
        last: LRUItem;
        max: number;
        ttl: number;
        resolver: (key: string) => any;
        clear(): LRU;
        delete_item(item: LRUItem): LRU;
        delete(key: string): LRU;
        entries(keys?: string[]): [string, any][];
        evict(): LRU;
        get(key: string): any;
        has(key: string): boolean;
        keys(): string[];
        new_item(key: string, value?: any): LRUItem;
        order_item(item: LRUItem): void;
        set(key: string, value: any): LRU;
        values(keys?: string[]): any[];
    }
}
